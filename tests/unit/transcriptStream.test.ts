import { describe, expect, it } from 'vitest';
import { TurnStatus, MessageType } from 'agora-agent-client-toolkit';
import {
  mergeTranscriptStreamEvents,
  parseTranscriptStreamEvent,
  toolkitTranscriptToStreamEvents,
  type TranscriptStreamEvent,
} from '@/lib/agora/transcriptStream';

const base: TranscriptStreamEvent = {
  version: 1,
  type: 'transcript',
  speaker: 'user',
  text: 'what animals',
  final: false,
  messageId: 'conv:user:1:1',
  timestamp: 100,
  conversationId: 'conv',
};

describe('transcript stream events', () => {
  it('updates a partial and replaces it with one final event', () => {
    const partial = { ...base, text: 'what animals live', timestamp: 200 };
    const final = { ...base, text: 'What animals live in India?', final: true, timestamp: 300 };
    const merged = mergeTranscriptStreamEvents([base], [partial, final], 'conv');

    expect(merged).toEqual([final]);
  });

  it('ignores duplicate finals and late partials', () => {
    const final = { ...base, final: true, timestamp: 300 };
    const result = mergeTranscriptStreamEvents(
      [final],
      [{ ...final }, { ...base, text: 'late partial', timestamp: 400 }],
      'conv',
    );

    expect(result).toEqual([final]);
  });

  it('drops events from an old conversation', () => {
    expect(
      mergeTranscriptStreamEvents(
        [],
        [{ ...base, conversationId: 'old' }],
        'new',
      ),
    ).toEqual([]);
  });

  it('safely rejects malformed wire payloads', () => {
    expect(parseTranscriptStreamEvent('{not json')).toBeNull();
    expect(parseTranscriptStreamEvent(JSON.stringify({ type: 'transcript' }))).toBeNull();
  });

  it('normalizes toolkit user transcripts into the shared schema', () => {
    const events = toolkitTranscriptToStreamEvents(
      [{
        uid: '0',
        stream_id: 4,
        turn_id: 9,
        _time: 1_788_410_000_500,
        text: 'hello',
        status: TurnStatus.END,
        metadata: {
          object: MessageType.USER_TRANSCRIPTION,
          final: true,
        },
      }],
      { conversationId: 'conv', entityId: 'pip' },
    );

    expect(events[0]).toMatchObject({
      speaker: 'user',
      final: true,
      messageId: 'conv:user:9:4',
      entityId: 'pip',
    });
  });
});
