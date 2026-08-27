import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stopCharacterAgent } from '@/lib/agora/agent';
import { isDemoModeEnabled } from '@/lib/validation/env';

const requestSchema = z.object({
  agentId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());

    if (isDemoModeEnabled()) {
      return NextResponse.json({ success: true, mode: 'demo' });
    }

    await stopCharacterAgent(body.agentId);
    return NextResponse.json({ success: true, mode: 'live' });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to stop agent',
      },
      { status: 500 },
    );
  }
}

