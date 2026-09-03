'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Bug, Mic, Sparkles, Volume2, VolumeX } from 'lucide-react';
import AgoraRTC, {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  AgentState,
  ChatMessagePriority,
  ChatMessageType,
  MessageSalStatus,
  TranscriptHelperMode,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from 'agora-agent-client-toolkit';
import { AgentVisualizer } from 'agora-agent-uikit';
import { MicButtonWithVisualizer } from 'agora-agent-uikit/rtc';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  getCurrentInProgressMessage,
  getMessageList,
  mapAgentVisualizerState,
  normalizeTimestampMs,
  normalizeTranscript,
} from '@/lib/conversation';
import { MicrophoneSelector } from './MicrophoneSelector';
import {
  getConversationIssueSeverity,
  type ConnectionIssue,
} from './ConversationErrorCard';
import { ConnectionStatusPanel } from './ConnectionStatusPanel';
import { QuickstartConversationLayout } from './QuickstartConversationLayout';
import {
  QuickstartPipelineMetrics,
  type QuickstartAgentMetric,
} from './QuickstartPipelineMetrics';
import { QuickstartTranscriptPanel } from './QuickstartTranscriptPanel';
import type { ConversationComponentProps } from '@/types/conversation';
import { LipSyncCharacter } from '@/components/characters/LipSyncCharacter';
import {
  LatencyDebugPanel,
  type LatencyTimings,
} from '@/components/LatencyDebugPanel';
import {
  mergeTranscriptStreamEvents,
  toolkitTranscriptToStreamEvents,
  type TranscriptStreamEvent,
} from '@/lib/agora/transcriptStream';

// Cap the displayed issues list to avoid overwhelming the UI during a cascade of errors.
const MAX_CONNECTION_ISSUES = 6;

type AgoraRtcWithParameters = typeof AgoraRTC & {
  setParameter?: (key: string, value: unknown) => void;
};

// Payload shape for signaling-level errors forwarded by the agent over RTM.
// The `module` field identifies which backend subsystem (LLM / ASR / TTS) raised the error.
type RtmMessageErrorPayload = {
  object: 'message.error';
  module?: string;
  code?: number;
  message?: string;
  send_ts?: number;
};

// Payload shape for SAL (Session Abstraction Layer) registration status messages.
// VP_REGISTER_FAIL and VP_REGISTER_DUPLICATE indicate RTM channel subscription problems.
type RtmSalStatusPayload = {
  object: 'message.sal_status';
  status?: string;
  timestamp?: number;
};

// Type guard for RTM signaling-level error payloads (object: 'message.error').
function isRtmMessageErrorPayload(
  value: unknown,
): value is RtmMessageErrorPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.error'
  );
}

// Type guard for RTM SAL status payloads (object: 'message.sal_status').
function isRtmSalStatusPayload(value: unknown): value is RtmSalStatusPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.sal_status'
  );
}

function pickSuggestedQuestions(questions: string[]) {
  if (questions.length <= 3) return questions;

  const keywordGroups = [/hatch|egg/i, /eat|food|corn|seed|insect/i, /fly|swim|shell|tail|tongue|climb/i];
  const chosen: string[] = [];

  for (const pattern of keywordGroups) {
    const match = questions.find(
      (question) => pattern.test(question) && !chosen.includes(question),
    );
    if (match) chosen.push(match);
  }

  for (const question of questions) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(question)) chosen.push(question);
  }

  return chosen.slice(0, 3);
}

function getQuestionEmoji(question: string) {
  if (/hatch|egg/i.test(question)) return '🥚';
  if (/eat|food|corn|seed|insect/i.test(question)) return '🌽';
  if (/fly|wing/i.test(question)) return '🪽';
  if (/swim/i.test(question)) return '🌊';
  if (/shell/i.test(question)) return '🐚';
  if (/tail/i.test(question)) return '🦎';
  return '✨';
}

export default function ConversationComponent({
  agoraData,
  rtmClient,
  onTokenWillExpire,
  onEndConversation,
  visualizerOverride,
  uiMode = 'default',
  character,
  scene = 'eggs',
  soundEnabled = true,
  onToggleSound,
  showDebug = false,
  showLatencyDebug = false,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isConnectionDetailsOpen, setIsConnectionDetailsOpen] = useState(false);

  // Tracks granular RTC connection state for the status dot.
  // Agora states: DISCONNECTED | CONNECTING | CONNECTED | DISCONNECTING | RECONNECTING
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const agentUID =
    process.env.NEXT_PUBLIC_AGENT_UID ?? String(DEFAULT_AGENT_UID);
  const [joinedUID, setJoinedUID] = useState<UID>(0);
  const [activeAgentUserId, setActiveAgentUserId] = useState<string | null>(null);

  // Transcript + agent state — managed with AgoraVoiceAI (see effect below).
  const [rawTranscript, setRawTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);
  const [transcriptEvents, setTranscriptEvents] = useState<
    TranscriptStreamEvent[]
  >([]);
  const [latencyTimings, setLatencyTimings] = useState<LatencyTimings>({});
  const transcriptObservationRef = useRef(new Map<string, string>());
  const finalizedTranscriptIdsRef = useRef(new Set<string>());
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<QuickstartAgentMetric[]>([]);
  const [connectionIssues, setConnectionIssues] = useState<ConnectionIssue[]>(
    [],
  );
  const addConnectionIssue = useCallback((issue: ConnectionIssue) => {
    setConnectionIssues((prev) => {
      const isDuplicate = prev.some(
        (x) =>
          x.agentUserId === issue.agentUserId &&
          x.code === issue.code &&
          x.message === issue.message &&
          Math.abs(x.timestamp - issue.timestamp) < 1500,
      );
      if (isDuplicate) return prev;
      return [issue, ...prev].slice(0, MAX_CONNECTION_ISSUES);
    });
  }, []);

  // Auto-open details panel as soon as a new issue is recorded.
  useEffect(() => {
    if (connectionIssues.length > 0) {
      setIsConnectionDetailsOpen(true);
    }
  }, [connectionIssues.length]);

  // StrictMode guard: delay `useJoin`'s ready flag until after the fake-unmount
  // cycle completes. React StrictMode fires cleanup synchronously before any
  // setTimeout callback, so the first (fake) mount's timeout is always cancelled.
  // Only the real second mount's timeout fires, meaning useJoin joins exactly once.
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setIsReady(false);
    };
  }, []);

  const rememberAgentUserId = useCallback((value?: string | null) => {
    if (value && value.trim()) {
      setActiveAgentUserId((current) => (current === value ? current : value));
    }
  }, []);

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10),
    },
    isReady,
  );

  // Create mic track only after the StrictMode fake-unmount cycle completes (isReady).
  // Passing `true` here creates two tracks in StrictMode — the first publishes, then
  // StrictMode cleanup closes it and the second takes over, causing a ~3s audio gap.
  // isReady uses the same setTimeout(fn,0) pattern as useJoin: StrictMode cleanup fires
  // synchronously before the timeout, so only the real second mount's timer fires.
  // Do NOT pass `isEnabled` — that ties track lifetime to mute state and breaks the Web Audio
  // graph inside MicButtonWithVisualizer. Mute uses track.setEnabled() only.
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady);

  // ENABLE_AUDIO_PTS is a module-level SDK parameter (not on the client instance).
  // It must be set before publishing audio for transcript timing to be accurate.
  useEffect(() => {
    if (!client) return;
    try {
      (AgoraRTC as AgoraRtcWithParameters).setParameter?.(
        'ENABLE_AUDIO_PTS',
        true,
      );
    } catch (error) {
      console.warn('Could not set ENABLE_AUDIO_PTS:', error);
    }
  }, [client]);

  // Track the auto-assigned RTC UID for token renewal and agent invite.
  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      if (uid !== null && uid !== undefined) {
        setJoinedUID(uid);
      }
    }
  }, [joinSuccess, client]);

  // Initialize AgoraVoiceAI once the channel is joined.
  //
  // Gating on `isReady && joinSuccess` is critical for StrictMode safety:
  //   - `isReady` ensures we are past the initial fake-unmount cycle, so this
  //     effect only runs on the real mount (not the discarded fake one).
  //   - Once `isReady` is true, React does NOT double-invoke this effect for
  //     subsequent state changes (`joinSuccess` becoming true). That means
  //     AgoraVoiceAI.init() is called exactly once.
  useEffect(() => {
    if (!isReady || !joinSuccess) return;

    let cancelled = false;

    (async () => {
      try {
        const ai = await AgoraVoiceAI.init({
          rtcEngine: client,
          rtmConfig: { rtmEngine: rtmClient },
          renderMode: TranscriptHelperMode.TEXT,
          // Verbose SDK transcript logging is useful for diagnostics but adds
          // avoidable console work on every live update in the child-facing UI.
          enableLog: showDebug || showLatencyDebug,
        });

        if (cancelled) {
          try {
            if (AgoraVoiceAI.getInstance() === ai) {
              // Tear down only the instance created by this effect run.
              ai.unsubscribe();
              ai.destroy();
            }
          } catch {}
          return;
        }

        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (t) => {
          const receivedAt = Date.now();
          setRawTranscript([...t]);
          const incoming = toolkitTranscriptToStreamEvents(t, {
            conversationId: agoraData.channel,
            entityId: character?.id,
            sceneId: scene,
            countryId: scene === 'globe' ? character?.id : undefined,
          });
          const changedEvents = incoming.filter((event) => {
            if (finalizedTranscriptIdsRef.current.has(event.messageId)) {
              return false;
            }
            const signature = `${event.final}:${event.text}`;
            if (transcriptObservationRef.current.get(event.messageId) === signature) {
              return false;
            }
            transcriptObservationRef.current.set(event.messageId, signature);
            if (event.final) {
              finalizedTranscriptIdsRef.current.add(event.messageId);
            }
            return true;
          });
          setTranscriptEvents((current) =>
            mergeTranscriptStreamEvents(current, incoming, agoraData.channel),
          );
          setLatencyTimings((current) => {
            const next = { ...current };
            for (const event of changedEvents) {
              if (event.speaker === 'user') {
                if (!event.final && !next.firstAsrPartialAt) {
                  next.firstAsrPartialAt = receivedAt;
                }
                if (event.final) next.finalAsrAt = receivedAt;
              } else {
                if (!next.firstAgentTextAt) next.firstAgentTextAt = receivedAt;
                if (event.final) next.agentTextCompletedAt = receivedAt;
              }
            }
            return next;
          });
        });
        // Agent state drives the visualizer, independent of RTC audio presence.
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (agentUserId, event) => {
          rememberAgentUserId(agentUserId);
          setAgentState(event.state);
          const observedAt = normalizeTimestampMs(event.timestamp || Date.now());
          setLatencyTimings((current) => {
            if (event.state === 'listening') {
              return { speechStartedAt: observedAt };
            }
            if (event.state === 'thinking') {
              return { ...current, speechEndedAt: observedAt };
            }
            if (event.state === 'speaking') {
              return { ...current, audioPlaybackStartedAt: observedAt };
            }
            return current;
          });
        });
        ai.on(AgoraVoiceAIEvents.AGENT_METRICS, (_, metrics) => {
          setAgentMetrics((prev) => [...prev, metrics].slice(-24));
        });
        ai.on(AgoraVoiceAIEvents.MESSAGE_ERROR, (agentUserId, error) => {
          rememberAgentUserId(agentUserId);
          addConnectionIssue({
            id: `${Date.now()}-${agentUserId}-message-error-${error.code}`,
            source: 'rtm',
            agentUserId,
            code: error.code,
            message: error.message,
            timestamp: normalizeTimestampMs(error.timestamp),
          });
        });
        // SAL status: capture raw RTM messages so message.sal_status surfaces even if higher-level events don't.
        ai.on(
          AgoraVoiceAIEvents.MESSAGE_SAL_STATUS,
          (agentUserId, salStatus) => {
            rememberAgentUserId(agentUserId);
            if (
              salStatus.status === MessageSalStatus.VP_REGISTER_FAIL ||
              salStatus.status === MessageSalStatus.VP_REGISTER_DUPLICATE
            ) {
              addConnectionIssue({
                id: `${Date.now()}-${agentUserId}-sal-${salStatus.status}`,
                source: 'rtm',
                agentUserId,
                code: salStatus.status,
                message: `SAL status: ${salStatus.status}`,
                timestamp: normalizeTimestampMs(salStatus.timestamp),
              });
            }
          },
        );
        // Agent error: capture raw RTM messages so message.error surfaces even if higher-level events don't.
        ai.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId, error) => {
          rememberAgentUserId(agentUserId);
          addConnectionIssue({
            id: `${Date.now()}-${agentUserId}-agent-error-${error.code}`,
            source: 'agent',
            agentUserId,
            code: error.code,
            message: `${error.type}: ${error.message}`,
            timestamp: normalizeTimestampMs(error.timestamp),
          });
        });
        // subscribeMessage binds the toolkit to both RTC stream messages and RTM payloads.
        ai.subscribeMessage(agoraData.channel);
      } catch (error) {
        if (!cancelled) {
          console.error('[AgoraVoiceAI] init failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        const ai = AgoraVoiceAI.getInstance();
        if (ai) {
          ai.unsubscribe();
          ai.destroy();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, joinSuccess]);

  // Raw RTM parsing is kept as a fallback for signaling-level errors and SAL status.
  useEffect(() => {
    const handleRtmMessage = (event: {
      message: string | Uint8Array;
      publisher: string;
    }) => {
      const payloadText =
        typeof event.message === 'string'
          ? event.message
          : new TextDecoder().decode(event.message);

      let parsed: unknown;
      try {
        parsed = JSON.parse(payloadText);
      } catch {
        return;
      }

      if (isRtmMessageErrorPayload(parsed)) {
        const p = parsed;
        addConnectionIssue({
          id: `${Date.now()}-${event.publisher}-rtm-msg-error-${p.code ?? 'unknown'}`,
          source: 'rtm-signaling',
          agentUserId: event.publisher,
          code: p.code ?? 'unknown',
          message: `${p.module ?? 'unknown'}: ${p.message ?? 'Unknown signaling error'}`,
          timestamp: normalizeTimestampMs(p.send_ts ?? Date.now()),
        });
        return;
      }

      if (isRtmSalStatusPayload(parsed)) {
        const p = parsed;
        if (
          p.status === 'VP_REGISTER_FAIL' ||
          p.status === 'VP_REGISTER_DUPLICATE'
        ) {
          addConnectionIssue({
            id: `${Date.now()}-${event.publisher}-rtm-sal-${p.status}`,
            source: 'rtm-signaling',
            agentUserId: event.publisher,
            code: p.status,
            message: `SAL status: ${p.status}`,
            timestamp: normalizeTimestampMs(p.timestamp ?? Date.now()),
          });
        }
      }
    };

    rtmClient.addEventListener('message', handleRtmMessage);
    return () => {
      rtmClient.removeEventListener('message', handleRtmMessage);
    };
  }, [rtmClient, addConnectionIssue, rememberAgentUserId]);

  // The toolkit uses uid="0" for local user speech — remap to actual RTC UID
  // so the transcript panel renders user messages on the correct side.
  // Also normalize punctuation spacing for display when upstream text arrives compacted.
  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  // Completed (END + INTERRUPTED) messages shown as history.
  // INTERRUPTED must be included — if the agent's first turn is cut off,
  // messageList stays empty and the first interrupted turn is never shown.
  const messageList = useMemo(() => getMessageList(transcript), [transcript]);

  const currentInProgressMessage = useMemo(() => {
    // The live partial turn renders separately from the completed history list.
    return getCurrentInProgressMessage(transcript);
  }, [transcript]);

  // Publish local mic once the track exists; usePublish waits for RTC connection.
  usePublish([localMicrophoneTrack]);

  useClientEvent(client, 'user-joined', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, 'user-left', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  // Sync isAgentConnected with remoteUsers (covers cases where user-joined/left are missed)
  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID,
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  useClientEvent(client, 'connection-state-change', (curState) => {
    setConnectionState(curState);
  });

  const connectionSeverity = useMemo<'normal' | 'warning' | 'error'>(() => {
    // RTC transport problems take precedence; otherwise derive severity from captured issues.
    if (
      connectionState === 'DISCONNECTED' ||
      connectionState === 'DISCONNECTING'
    ) {
      return 'error';
    }
    if (
      connectionState === 'CONNECTING' ||
      connectionState === 'RECONNECTING'
    ) {
      return 'warning';
    }
    if (connectionIssues.length === 0) {
      return 'normal';
    }
    return connectionIssues.some(
      (issue) => getConversationIssueSeverity(issue) === 'error',
    )
      ? 'error'
      : 'warning';
  }, [connectionState, connectionIssues]);

  const visualizerState = useMemo(
    () =>
      mapAgentVisualizerState(agentState, isAgentConnected, connectionState),
    [agentState, isAgentConnected, connectionState],
  );

  /**
   * Mute/unmute via track.setEnabled() only — usePublish owns publish state.
   * If we also unpublish in the toggle, usePublish and the button fight each other
   * and break the MicButtonWithVisualizer Web Audio graph.
   */
  const handleMicToggle = useCallback(async () => {
    const next = !isEnabled;
    const track = localMicrophoneTrack;
    if (!track) {
      setIsEnabled(next);
      return;
    }
    try {
      await track.setEnabled(next);
      setIsEnabled(next);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [isEnabled, localMicrophoneTrack]);

  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      // RTC and RTM renew independently, but the quickstart fetches both in one request.
      const { rtcToken, rtmToken } = await onTokenWillExpire(
        joinedUID.toString(),
      );
      await client?.renewToken(rtcToken);
      await rtmClient.renewToken(rtmToken);
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, joinedUID, rtmClient]);

  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);

  const handleEndConversation = useCallback(async () => {
    onEndConversation();
  }, [onEndConversation]);

  const handleQuestionChip = useCallback(
    async (question: string) => {
      if (!isAgentConnected || connectionState !== 'CONNECTED' || !activeAgentUserId) {
        console.warn(
          'Suggested question skipped because the live agent messaging channel is not ready yet.',
          {
            isAgentConnected,
            connectionState,
            activeAgentUserId,
          },
        );
        return;
      }

      try {
        const ai = AgoraVoiceAI.getInstance();
        await ai.sendText(activeAgentUserId, {
          messageType: ChatMessageType.TEXT,
          text: question,
          priority: ChatMessagePriority.INTERRUPTED,
          responseInterruptable: true,
        });
      } catch (error) {
        console.error('Failed to send suggested question:', error);
      }
    },
    [activeAgentUserId, connectionState, isAgentConnected],
  );

  const latestCaption = useMemo(() => {
    const latestAgentEvent = [...transcriptEvents]
      .reverse()
      .find((event) => event.speaker === 'agent');
    if (latestAgentEvent?.text) return latestAgentEvent.text;

    const inProgressText =
      currentInProgressMessage &&
      String(currentInProgressMessage.uid) === agentUID &&
      currentInProgressMessage.text?.trim();
    if (inProgressText) return inProgressText;

    const latestAgentMessage = [...messageList]
      .reverse()
      .find((message) => String(message.uid) === agentUID && message.text?.trim());
    return latestAgentMessage?.text?.trim() || character?.voiceIntro || '';
  }, [agentUID, character?.voiceIntro, currentInProgressMessage, messageList, transcriptEvents]);

  const latestUserTranscript = useMemo(
    () => [...transcriptEvents].reverse().find((event) => event.speaker === 'user'),
    [transcriptEvents],
  );

  const suggestedQuestions = useMemo(
    () => pickSuggestedQuestions(character?.starterQuestions ?? []),
    [character?.starterQuestions],
  );

  const micState = useMemo(() => {
    if (!isEnabled) {
      return { label: `Ask ${character?.name ?? 'your friend'} something`, detail: 'Tap the microphone to start', state: 'idle' as const };
    }
    if (agentState === 'speaking') {
      return { label: `${character?.name ?? 'Your friend'} is talking...`, detail: 'Listen for the answer', state: 'speaking' as const };
    }
    if (agentState === 'thinking') {
      return { label: 'Hmm...', detail: 'Thinking of an answer', state: 'thinking' as const };
    }
    if (agentState === 'listening') {
      return { label: "I'm listening...", detail: 'Ask your question now', state: 'listening' as const };
    }
    return { label: `Ask ${character?.name ?? 'your friend'} something`, detail: 'Voice is ready', state: 'idle' as const };
  }, [agentState, character?.name, isEnabled]);

  if (uiMode === 'storybook' && character) {
    const hasImage = Boolean(character.imageSrc);
    const accentStyle = {
      background: `linear-gradient(180deg, ${character.palette.body}, ${character.palette.shell})`,
      boxShadow: `0 26px 48px ${character.palette.glow}`,
    };

    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,249,233,0.18),rgba(255,247,232,0.08))] px-5 py-5 text-slate-900 sm:px-7 sm:py-6">
        <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,252,240,0.5),rgba(255,252,240,0.08)_48%,transparent_72%)]" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleEndConversation}
            className="relative inline-flex min-h-12 items-center gap-2 rounded-full bg-[#fff7ef] px-5 py-3 text-sm font-black text-slate-800 shadow-[0_10px_24px_rgba(83,58,27,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
          >
            <ArrowLeft className="h-4 w-4" />
            {scene === 'eggs'
              ? 'Back to Eggs'
              : scene === 'globe'
                ? 'Back to the Globe'
                : 'Back to Jungle'}
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff7ef] text-slate-700 shadow-[0_10px_24px_rgba(83,58,27,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
            aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative mt-5 flex min-h-0 flex-1 flex-col gap-6 lg:mt-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#67b66d] px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(103,182,109,0.25)]">
              <span>{scene === 'eggs' ? '🐥' : scene === 'globe' ? '🌍' : '🌿'}</span>
              {scene === 'eggs'
                ? 'New Friend'
                : scene === 'globe'
                  ? 'World Guide'
                  : 'Jungle Friend'}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-[4.6rem]">
              {character.title}
            </h1>
          </div>

          <div
            className={
              hasImage
                ? 'grid flex-1 gap-5 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-center lg:gap-8'
                : 'mx-auto grid w-full max-w-[44rem] flex-1 grid-cols-1 items-start gap-5'
            }
          >
            {hasImage ? (
              <div className="flex flex-col items-center justify-center lg:justify-end">
                <div className="animate-float-character">
                  {visualizerOverride ?? (
                    <LipSyncCharacter
                      emoji={character.emoji}
                      imageSrc={character.imageSrc}
                      name={character.name}
                      palette={character.palette}
                      mouthOpen={agentState === 'speaking' ? 0.8 : 0.15}
                      speaking={agentState === 'speaking'}
                      size="large"
                    />
                  )}
                </div>
              </div>
            ) : null}

            <div
              className={`flex flex-col gap-4 lg:gap-5 ${hasImage ? '' : 'items-center'}`}
            >
              {latestUserTranscript ? (
                <div
                  className={`animate-fade-up self-center rounded-[22px] bg-[#fff7ef] px-5 py-3 text-left shadow-[0_12px_24px_rgba(83,58,27,0.1)] ${hasImage ? 'max-w-[28rem] lg:self-start' : 'w-full max-w-[40rem]'}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7f8f54]">
                    You{latestUserTranscript.final ? '' : ' ...'}
                  </p>
                  <p className="mt-1 text-base font-semibold leading-6 text-slate-800 sm:text-lg">
                    {latestUserTranscript.text}
                  </p>
                </div>
              ) : null}
              <div className={`animate-fade-up relative self-center rounded-[30px] bg-white px-6 py-5 text-left shadow-[0_18px_34px_rgba(91,71,41,0.12)] ${hasImage ? 'max-w-[28rem] lg:self-start' : 'w-full max-w-[40rem]'}`}>
                <div className="absolute left-[-10px] top-[56%] h-6 w-6 -translate-y-1/2 rotate-45 rounded-[6px] bg-white" />
                <p className="text-lg font-semibold leading-8 text-slate-800 sm:text-[1.5rem] sm:leading-[2.15rem]">
                  {latestCaption}
                </p>
              </div>

              <div className={`self-center rounded-[30px] bg-[#ffe19a] px-6 py-5 text-left shadow-[0_18px_34px_rgba(196,149,52,0.18)] ${hasImage ? 'max-w-[24rem] lg:self-start' : 'w-full max-w-[36rem]'}`}>
                <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-900">
                  <Sparkles className="h-4 w-4 fill-current" />
                  Did you know?
                </div>
                <p className="mt-3 text-lg leading-8 text-amber-950">
                  {character.funFacts[0]}
                </p>
              </div>

              <div className={`flex flex-wrap justify-center gap-3 ${hasImage ? 'lg:justify-start' : ''}`}>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleQuestionChip(question)}
                    className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#fff7ef] px-5 py-3 text-base font-bold text-slate-800 shadow-[0_12px_26px_rgba(83,58,27,0.12)] transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
                  >
                    <span className="text-xl">{getQuestionEmoji(question)}</span>
                    <span>{question}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-auto flex flex-col items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleMicToggle}
              className="relative flex h-[6.5rem] w-[6.5rem] items-center justify-center rounded-full text-white shadow-[0_22px_48px_rgba(93,70,34,0.28)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
              style={{
                ...accentStyle,
                background:
                  micState.state === 'listening'
                    ? 'linear-gradient(180deg, #b4ef7f, #4f8b43)'
                    : 'linear-gradient(180deg, #f0d66d, #6a8e48)',
              }}
              aria-label={isEnabled ? 'Mute microphone' : 'Activate microphone'}
            >
              {micState.state === 'listening' ? (
                <>
                  <span className="absolute inset-0 rounded-full border-4 border-[#d6ff9a]/70 animate-mic-pulse" />
                  <span className="absolute inset-[-12px] rounded-full border-[3px] border-[#d6ff9a]/35 animate-mic-pulse [animation-delay:160ms]" />
                </>
              ) : null}
              {micState.state === 'thinking' ? (
                <span className="absolute -right-1 top-1 rounded-full bg-[#fff2b7] p-2 text-amber-600 animate-hatch-sparkle">
                  <Sparkles className="h-4 w-4" />
                </span>
              ) : null}
              {micState.state === 'speaking' ? (
                <span className="absolute bottom-[-12px] flex items-end gap-1">
                  <span className="h-4 w-1.5 rounded-full bg-white/80 animate-wave-bounce" />
                  <span className="h-7 w-1.5 rounded-full bg-white animate-wave-bounce [animation-delay:120ms]" />
                  <span className="h-5 w-1.5 rounded-full bg-white/85 animate-wave-bounce [animation-delay:240ms]" />
                </span>
              ) : null}
              <Mic className="h-10 w-10" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-900">{micState.label}</p>
              <p className="mt-1 text-sm font-semibold text-[#7f8f54]">{micState.detail}</p>
            </div>
          </div>

          {showDebug ? (
            <details className="mt-2 rounded-[24px] bg-slate-950/80 px-5 py-4 text-white shadow-[0_18px_34px_rgba(17,24,39,0.24)]">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-emerald-200">
                <Bug className="h-4 w-4" />
                Debug
              </summary>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Agora Conversational AI
                  </p>
                  <div className="mt-3">
                    <QuickstartPipelineMetrics metrics={agentMetrics} />
                  </div>
                  <p className="mt-3 text-xs text-slate-300">
                    Connection: {connectionState.toLowerCase()}
                  </p>
                  {connectionIssues.length ? (
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {connectionIssues.map((issue) => (
                        <li key={issue.id}>{issue.message}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="h-64 min-h-0">
                  <QuickstartTranscriptPanel
                    messageList={messageList}
                    currentInProgressMessage={currentInProgressMessage}
                    agentUID={agentUID}
                  />
                </div>
              </div>
            </details>
          ) : null}

          {showLatencyDebug ? (
            <LatencyDebugPanel
              events={transcriptEvents}
              metrics={agentMetrics}
              agentState={agentState}
              timings={latencyTimings}
            />
          ) : null}

          {remoteUsers.map((user) => (
            <div key={user.uid} className="hidden">
              <RemoteUser user={user} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <QuickstartConversationLayout
      statusPanel={
        <ConnectionStatusPanel
          connectionState={connectionState}
          connectionSeverity={connectionSeverity}
          connectionIssues={connectionIssues}
          isOpen={isConnectionDetailsOpen}
          onToggle={() => setIsConnectionDetailsOpen((open) => !open)}
        />
      }
      pipelineMetrics={<QuickstartPipelineMetrics metrics={agentMetrics} />}
      transcriptPanel={
        <QuickstartTranscriptPanel
          messageList={messageList}
          currentInProgressMessage={currentInProgressMessage}
          agentUID={agentUID}
        />
      }
      visualizer={
        <div
          className="relative flex h-full min-h-[20rem] w-full max-w-4xl items-center justify-center"
          role="region"
          aria-label="AI agent status visualization"
        >
          {visualizerOverride ?? (
            <AgentVisualizer state={visualizerState} size="lg" />
          )}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="hidden">
              <RemoteUser user={user} />
            </div>
          ))}
        </div>
      }
      controls={
        <div
          className="mx-auto flex w-fit items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-2 backdrop-blur-md"
          role="group"
          aria-label="Audio controls"
        >
          <div className="conversation-mic-host flex items-center justify-center">
            <MicButtonWithVisualizer
              isEnabled={isEnabled}
              setIsEnabled={setIsEnabled}
              track={localMicrophoneTrack}
              onToggle={handleMicToggle}
              className="overflow-visible"
              aria-label={isEnabled ? 'Mute microphone' : 'Unmute microphone'}
              enabledColor="hsl(var(--primary))"
              disabledColor="hsl(var(--destructive))"
            />
          </div>
          <MicrophoneSelector localMicrophoneTrack={localMicrophoneTrack} />
        </div>
      }
      onEndConversation={handleEndConversation}
    />
  );
}
