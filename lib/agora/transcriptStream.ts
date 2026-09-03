import { z } from 'zod';
import {
  MessageType,
  TurnStatus,
  type AgentTranscription,
  type TranscriptHelperItem,
  type UserTranscription,
} from 'agora-agent-client-toolkit';

export const transcriptStreamEventSchema = z.object({
  version: z.literal(1),
  type: z.literal('transcript'),
  speaker: z.enum(['user', 'agent']),
  text: z.string(),
  final: z.boolean(),
  messageId: z.string().min(1),
  timestamp: z.number().finite(),
  conversationId: z.string().optional(),
  entityId: z.string().optional(),
  sceneId: z.string().optional(),
  countryId: z.string().optional(),
});

export type TranscriptStreamEvent = z.infer<typeof transcriptStreamEventSchema>;

type ToolkitTranscript = TranscriptHelperItem<
  Partial<UserTranscription | AgentTranscription>
>;

export type TranscriptContext = {
  conversationId: string;
  entityId?: string;
  sceneId?: string;
  countryId?: string;
};

export function parseTranscriptStreamEvent(
  payload: string | Uint8Array,
): TranscriptStreamEvent | null {
  try {
    const text =
      typeof payload === 'string' ? payload : new TextDecoder().decode(payload);
    const result = transcriptStreamEventSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function normalizeTimestamp(timestamp: number): number {
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
}

export function toolkitTranscriptToStreamEvents(
  transcript: ToolkitTranscript[],
  context: TranscriptContext,
): TranscriptStreamEvent[] {
  return transcript.flatMap((item) => {
    const object = item.metadata?.object;
    const speaker =
      object === MessageType.USER_TRANSCRIPTION
        ? 'user'
        : object === MessageType.AGENT_TRANSCRIPTION
          ? 'agent'
          : null;

    if (!speaker || typeof item.text !== 'string' || !item.text.trim()) return [];

    const final =
      speaker === 'user'
        ? (item.metadata as Partial<UserTranscription>).final === true
        : item.status !== TurnStatus.IN_PROGRESS;
    const event: TranscriptStreamEvent = {
      version: 1,
      type: 'transcript',
      speaker,
      text: item.text.trim(),
      final,
      messageId: `${context.conversationId}:${speaker}:${item.turn_id}:${item.stream_id}`,
      timestamp: normalizeTimestamp(item._time),
      ...context,
    };
    return [event];
  });
}

export function mergeTranscriptStreamEvents(
  current: TranscriptStreamEvent[],
  incoming: TranscriptStreamEvent[],
  activeConversationId: string,
): TranscriptStreamEvent[] {
  const merged = new Map(
    current
      .filter((event) => event.conversationId === activeConversationId)
      .map((event) => [event.messageId, event]),
  );

  for (const event of incoming) {
    if (event.conversationId !== activeConversationId) continue;
    const existing = merged.get(event.messageId);
    if (existing?.final) continue;
    if (!existing || event.timestamp >= existing.timestamp || event.final) {
      merged.set(event.messageId, event);
    }
  }

  return [...merged.values()].sort((a, b) => a.timestamp - b.timestamp);
}
