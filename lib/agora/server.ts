import { AgoraClient, Area } from 'agora-agents';
import { getServerEnv } from '@/lib/validation/env';

export function createAgoraClient() {
  const env = getServerEnv();
  const appId = env.NEXT_PUBLIC_AGORA_APP_ID ?? env.AGORA_APP_ID;
  const appCertificate =
    env.NEXT_AGORA_APP_CERTIFICATE ?? env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('Agora App ID or App Certificate is missing.');
  }

  return new AgoraClient({
    area: Area.US,
    appId,
    appCertificate,
  });
}

export function getAgoraCredentials() {
  const env = getServerEnv();
  const appId = env.NEXT_PUBLIC_AGORA_APP_ID ?? env.AGORA_APP_ID;
  const appCertificate =
    env.NEXT_AGORA_APP_CERTIFICATE ?? env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    throw new Error('Agora App ID or App Certificate is missing.');
  }

  return { appId, appCertificate };
}

