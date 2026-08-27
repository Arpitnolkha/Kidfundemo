import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { startCharacterAgent, stopCharacterAgent } from '@/lib/agora/agent';
import { isDemoModeEnabled } from '@/lib/validation/env';

const requestSchema = z.object({
  previousAgentId: z.string().optional(),
  characterId: z.string(),
  scene: z.enum(['eggs', 'jungle', 'globe']),
  channelName: z.string(),
  requesterId: z.string(),
  discoveries: z.number().int().nonnegative().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    if (isDemoModeEnabled()) {
      return NextResponse.json({
        mode: 'demo',
        agentId: `demo-${body.characterId}`,
        state: 'RUNNING',
      });
    }

    if (body.previousAgentId) {
      await stopCharacterAgent(body.previousAgentId).catch(() => undefined);
    }

    const agentId = await startCharacterAgent(body);
    return NextResponse.json({
      mode: 'live',
      agentId,
      state: 'RUNNING',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update character',
      },
      { status: 500 },
    );
  }
}
