import { RtcRole, RtcTokenBuilder } from 'agora-token';

const EXPIRATION_TIME_IN_SECONDS = 60 * 60;

export function generateChannelName(scene: 'eggs' | 'jungle' | 'globe'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `kids-${scene}-${timestamp}-${random}`;
}

export function buildAgoraRtcRtmToken(input: {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: string;
}) {
  const expirationTime =
    Math.floor(Date.now() / 1000) + EXPIRATION_TIME_IN_SECONDS;

  return RtcTokenBuilder.buildTokenWithRtm(
    input.appId,
    input.appCertificate,
    input.channelName,
    input.uid,
    RtcRole.PUBLISHER,
    expirationTime,
    expirationTime,
  );
}
