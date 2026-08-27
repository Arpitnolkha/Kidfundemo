import { NextRequest, NextResponse } from 'next/server';
import { generateChannelName, buildAgoraRtcRtmToken } from '@/lib/agora/tokens';
import { getAgoraCredentials } from '@/lib/agora/server';
import { isDemoModeEnabled } from '@/lib/validation/env';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scene =
    searchParams.get('scene') === 'jungle' ? 'jungle' : 'eggs';
  const uidParam = searchParams.get('uid');
  const channelParam = searchParams.get('channel');
  const uid =
    uidParam && uidParam.trim()
      ? uidParam
      : `${Math.floor(Math.random() * 9_000_000) + 100000}`;
  const channelName = channelParam || generateChannelName(scene);

  if (isDemoModeEnabled()) {
    return NextResponse.json({
      mode: 'demo',
      token: 'demo-token',
      uid,
      channel: channelName,
    });
  }

  try {
    const { appId, appCertificate } = getAgoraCredentials();
    const token = buildAgoraRtcRtmToken({
      appId,
      appCertificate,
      channelName,
      uid,
    });

    return NextResponse.json({
      mode: 'live',
      token,
      uid,
      channel: channelName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate Agora token',
      },
      { status: 500 },
    );
  }
}

