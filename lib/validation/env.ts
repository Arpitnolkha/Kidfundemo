import { z } from 'zod';

const trueLike = z
  .string()
  .optional()
  .transform((value) => value === 'true');

export const serverEnvSchema = z.object({
  AGORA_APP_ID: z.string().optional(),
  AGORA_APP_CERTIFICATE: z.string().optional(),
  AGORA_CUSTOMER_ID: z.string().optional(),
  AGORA_CUSTOMER_SECRET: z.string().optional(),
  AGORA_INTERACTION_LANGUAGE: z.string().optional(),
  NEXT_PUBLIC_AGORA_APP_ID: z.string().optional(),
  NEXT_AGORA_APP_CERTIFICATE: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  MURF_API_KEY: z.string().optional(),
  MURF_VOICE_ID: z.string().optional(),
  MURF_TTS_VOICE_ID: z.string().optional(),
  MURF_TTS_MODEL: z.string().optional(),
  MURF_TTS_LOCALE: z.string().optional(),
  MURF_TTS_BASE_URL: z.string().optional(),
  MURF_TTS_RATE: z.string().optional(),
  MURF_TTS_PITCH: z.string().optional(),
  MURF_TTS_SAMPLE_RATE: z.string().optional(),
  TTS_PROVIDER: z.string().optional(),
  TTS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_DEMO_MODE: trueLike,
  NEXT_PUBLIC_SHOW_DEV_PANEL: trueLike,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse(process.env);
}

export function isDemoModeEnabled(env = getServerEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_DEMO_MODE ||
      !env.NEXT_PUBLIC_AGORA_APP_ID ||
      !env.NEXT_AGORA_APP_CERTIFICATE,
  );
}
