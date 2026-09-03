'use client';

import Image from 'next/image';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import type { RTMClient } from 'agora-rtm';
import type { AgoraRenewalTokens, AgoraTokenData } from '@/types/conversation';
import type { LearningCharacter } from '@/lib/characters/types';
import type { VoiceState } from '@/lib/game/store';
import { CharacterStage } from '@/components/characters/CharacterStage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LipSyncCharacter } from '@/components/characters/LipSyncCharacter';

const ConversationComponent = dynamic(() => import('@/components/ConversationComponent'), {
  ssr: false,
});

const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } =
      await import('agora-rtc-react');
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

type LiveSessionResources = {
  agentId?: string;
  rtmClient?: RTMClient | null;
};

const isLiveVoiceEnabled =
  process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' &&
  Boolean(process.env.NEXT_PUBLIC_AGORA_APP_ID);

function StorybookLiveVisualizer({
  character,
  speaking,
}: {
  character: LearningCharacter;
  speaking: boolean;
}) {
  return (
    <div className="flex h-full min-h-[20rem] w-full items-end justify-center">
      {character.imageSrc ? (
        <div className="relative h-[17rem] w-[17rem] overflow-hidden sm:h-[18.5rem] sm:w-[18.5rem] lg:h-[20rem] lg:w-[20rem]">
          <div
            className="absolute inset-x-[8%] bottom-[8%] h-[22%] rounded-[50%] blur-2xl"
            style={{ backgroundColor: character.palette.glow }}
            aria-hidden="true"
          />
          <div className={`relative h-full w-full ${speaking ? 'animate-float-character' : ''}`}>
            <Image
              src={character.imageSrc}
              alt={character.name}
              fill
              sizes="(max-width: 640px) 17rem, (max-width: 1024px) 18.5rem, 20rem"
              className="scale-[1.18] object-cover object-top drop-shadow-[0_24px_38px_rgba(90,63,28,0.22)]"
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            className="absolute inset-[-14px] rounded-[34px] bg-[radial-gradient(circle,rgba(72,220,203,0.28),rgba(157,129,255,0.18),transparent_72%)] blur-xl"
            aria-hidden="true"
          />
          <div className="relative">
            <LipSyncCharacter
              emoji={character.emoji}
              imageSrc={character.imageSrc}
              name={character.name}
              palette={character.palette}
              mouthOpen={speaking ? 0.85 : 0.15}
              speaking={speaking}
              size="large"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StorybookConnectingScreen({
  character,
  scene,
  soundEnabled,
  onToggleSound,
  onBack,
  message,
}: {
  character: LearningCharacter;
  scene: 'eggs' | 'jungle' | 'globe';
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBack: () => void;
  message: string;
}) {
  const suggestedQuestions = character.starterQuestions.slice(0, 3);
  const hasImage = Boolean(character.imageSrc);

  return (
    <div className="relative flex min-h-[38rem] flex-col overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(255,249,233,0.18),rgba(255,247,232,0.08))] px-5 py-5 text-slate-900 sm:px-7 sm:py-6">
      <div className="absolute inset-0 rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(255,252,240,0.5),rgba(255,252,240,0.08)_48%,transparent_72%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#fff7ef] px-5 py-3 text-sm font-black text-slate-800 shadow-[0_10px_24px_rgba(83,58,27,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
        >
          <ArrowLeft className="h-4 w-4" />
          {scene === 'eggs'
            ? 'Back to Eggs'
            : scene === 'jungle'
              ? 'Back to Jungle'
              : 'Back to the Globe'}
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff7ef] text-slate-700 shadow-[0_10px_24px_rgba(83,58,27,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
          aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative mt-5 flex min-h-0 flex-1 flex-col gap-6 lg:mt-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#67b66d] px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(103,182,109,0.25)]">
            <span>{scene === 'eggs' ? '🐥' : scene === 'jungle' ? '🌿' : '🌍'}</span>
            {scene === 'eggs'
              ? 'New Friend'
              : scene === 'jungle'
                ? 'Jungle Friend'
                : 'World Guide'}
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
              <StorybookLiveVisualizer character={character} speaking={false} />
            </div>
          ) : null}

          <div className={`flex flex-col gap-4 lg:gap-5 ${hasImage ? '' : 'items-center'}`}>
            <div className={`relative self-center rounded-[30px] bg-white px-6 py-5 text-left shadow-[0_18px_34px_rgba(91,71,41,0.12)] ${hasImage ? 'max-w-[28rem] lg:self-start' : 'w-full max-w-[40rem]'}`}>
              <div className="absolute left-[-10px] top-[56%] h-6 w-6 -translate-y-1/2 rotate-45 rounded-[6px] bg-white" />
              <p className="text-lg font-semibold leading-8 text-slate-800 sm:text-[1.5rem] sm:leading-[2.15rem]">
                {character.voiceIntro}
              </p>
            </div>

            <div className={`self-center rounded-[30px] bg-[#ffe19a] px-6 py-5 text-left shadow-[0_18px_34px_rgba(196,149,52,0.18)] ${hasImage ? 'max-w-[24rem] lg:self-start' : 'w-full max-w-[36rem]'}`}>
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-900">
                <span>✨</span>
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
                  disabled
                  className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#fff7ef] px-5 py-3 text-base font-bold text-slate-800 opacity-90 shadow-[0_12px_26px_rgba(83,58,27,0.12)]"
                >
                  <span className="text-xl">✨</span>
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-auto flex flex-col items-center gap-3 pt-2">
          <div className="relative flex h-[6.5rem] w-[6.5rem] items-center justify-center rounded-full bg-[linear-gradient(180deg,#f0d66d,#6a8e48)] text-white shadow-[0_22px_48px_rgba(93,70,34,0.28)]">
            <div className="absolute inset-0 rounded-full border-4 border-[#d6ff9a]/70 animate-mic-pulse" />
            <div className="absolute inset-[-12px] rounded-full border-[3px] border-[#d6ff9a]/35 animate-mic-pulse [animation-delay:160ms]" />
            <div className="h-10 w-10 rounded-full bg-white/28" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">Getting ready...</p>
            <p className="mt-1 text-sm font-semibold text-[#7f8f54]">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CharacterConversationExperience({
  character,
  scene,
  transcript,
  onTranscriptChange,
  status,
  onStatusChange,
  soundEnabled,
  onToggleSound,
  onRequestMic,
  devPanel,
  discoveries,
  onClose,
}: {
  character: LearningCharacter;
  scene: 'eggs' | 'jungle' | 'globe';
  transcript: string;
  onTranscriptChange: (line: string) => void;
  status: VoiceState;
  onStatusChange: (state: VoiceState) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRequestMic: () => Promise<boolean>;
  devPanel: boolean;
  discoveries: number;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const sessionRef = useRef<LiveSessionResources>({});
  const searchParams = useSearchParams();
  const showDebug = searchParams.get('debug') === 'true';
  const showLatencyDebug = searchParams.get('debugLatency') === 'true';

  const sessionKey = useMemo(
    () => `${scene}:${character.id}:${discoveries}`,
    [scene, character.id, discoveries],
  );

  const stopLiveSession = useCallback(async (resources?: LiveSessionResources) => {
    const activeResources = resources ?? sessionRef.current;

    if (activeResources.agentId) {
      try {
        await fetch('/api/agora/agent/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: activeResources.agentId }),
        });
      } catch (stopError) {
        console.error('Failed to stop Agora agent:', stopError);
      }
    }

    if (activeResources.rtmClient) {
      try {
        await activeResources.rtmClient.logout();
      } catch (logoutError) {
        console.error('Failed to logout RTM client:', logoutError);
      }
    }

    if (!resources || sessionRef.current === activeResources) {
      sessionRef.current = {};
      setAgoraData(null);
      setRtmClient(null);
    }
  }, []);

  useEffect(() => {
    if (!isLiveVoiceEnabled) return;

    let cancelled = false;

    async function startLiveSession() {
      setIsLoading(true);
      setError(null);

      try {
        const tokenResponse = await fetch(`/api/agora/token?scene=${scene}`);
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          throw new Error(tokenData.error ?? 'Failed to generate Agora token');
        }

        const { default: AgoraRTM } = await import('agora-rtm');
        const nextRtmClient: RTMClient = new AgoraRTM.RTM(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          tokenData.uid,
        );

        await nextRtmClient.login({ token: tokenData.token });
        await nextRtmClient.subscribe(tokenData.channel);

        const agentResponse = await fetch('/api/agora/agent/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            characterId: character.id,
            scene,
            channelName: tokenData.channel,
            requesterId: tokenData.uid,
            discoveries,
          }),
        });
        const agentData = await agentResponse.json();

        if (!agentResponse.ok) {
          await nextRtmClient.logout().catch(() => undefined);
          throw new Error(agentData.error ?? 'Failed to start Agora agent');
        }

        const nextSession = {
          agentId: agentData.agentId,
          rtmClient: nextRtmClient,
        };

        if (cancelled) {
          await stopLiveSession(nextSession);
          return;
        }

        sessionRef.current = nextSession;
        setAgoraData({
          token: tokenData.token,
          uid: tokenData.uid,
          channel: tokenData.channel,
          agentId: agentData.agentId,
        });
        setRtmClient(nextRtmClient);
      } catch (startError) {
        if (!cancelled) {
          const message =
            startError instanceof Error
              ? startError.message
              : 'Failed to start live voice conversation.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void startLiveSession();

    return () => {
      cancelled = true;
      void stopLiveSession();
    };
  }, [character.id, discoveries, scene, sessionKey, stopLiveSession]);

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      if (!agoraData?.channel) {
        throw new Error('Missing Agora channel for token renewal');
      }

      const response = await fetch(
        `/api/agora/token?scene=${scene}&channel=${agoraData.channel}&uid=${uid}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to renew Agora token');
      }

      return {
        rtcToken: data.token,
        rtmToken: data.token,
      };
    },
    [agoraData?.channel, scene],
  );

  const handleEndConversation = useCallback(async () => {
    await stopLiveSession();
    onClose();
  }, [onClose, stopLiveSession]);

  if (!isLiveVoiceEnabled) {
    return (
      <CharacterStage
        character={character}
        mode="demo"
        transcript={transcript}
        onTranscriptChange={onTranscriptChange}
        status={status}
        onStatusChange={onStatusChange}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onRequestMic={onRequestMic}
        devPanel={devPanel}
      />
    );
  }

  if (isLoading || !agoraData || !rtmClient) {
    return (
      <div className="rounded-[28px] bg-transparent p-1 sm:rounded-[32px] sm:p-2">
        <StorybookConnectingScreen
          character={character}
          scene={scene}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          onBack={onClose}
          message={`Connecting to ${character.name}'s voice channel...`}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] bg-transparent p-1 sm:rounded-[32px] sm:p-2">
        <StorybookConnectingScreen
          character={character}
          scene={scene}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
          onBack={onClose}
          message={error}
        />
      </div>
    );
  }

  return (
    <div className="rounded-[28px] bg-transparent p-1 sm:rounded-[32px] sm:p-2">
      <div className="max-h-[calc(100dvh-4.5rem)] min-h-[min(36rem,calc(100dvh-4.5rem))] overflow-y-auto">
        <Suspense
          fallback={
            <StorybookConnectingScreen
              character={character}
              scene={scene}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              onBack={onClose}
              message={`Opening ${character.name}'s storybook...`}
            />
          }
        >
          <ErrorBoundary>
            <AgoraProvider>
              <ConversationComponent
                agoraData={agoraData}
                rtmClient={rtmClient}
                onTokenWillExpire={handleTokenWillExpire}
                onEndConversation={handleEndConversation}
                uiMode="storybook"
                character={character}
                scene={scene}
                soundEnabled={soundEnabled}
                onToggleSound={onToggleSound}
                showDebug={showDebug}
                showLatencyDebug={showLatencyDebug}
                visualizerOverride={
                  <StorybookLiveVisualizer
                    character={character}
                    speaking={status === 'speaking'}
                  />
                }
              />
            </AgoraProvider>
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}
