import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { startCharacterAgent } from '@/lib/agora/agent';
import { getCharacterById } from '@/lib/characters';
import { isDemoModeEnabled } from '@/lib/validation/env';

const requestSchema = z.object({
  characterId: z.string(),
  scene: z.enum(['eggs', 'jungle', 'globe']),
  channelName: z.string(),
  requesterId: z.string(),
  discoveries: z.number().int().nonnegative().default(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    if (!getCharacterById(body.characterId)) {
      return NextResponse.json(
        { error: 'Unknown character' },
        { status: 404 },
      );
    }

    if (isDemoModeEnabled()) {
      return NextResponse.json({
        mode: 'demo',
        agentId: `demo-${body.characterId}`,
        state: 'RUNNING',
      });
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
            : 'Failed to start agent',
      },
      { status: 500 },
    );
  }
}
