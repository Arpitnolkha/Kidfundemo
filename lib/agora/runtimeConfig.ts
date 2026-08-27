const SUPPORTED_INTERACTION_LANGUAGES = [
  'ar-EG',
  'ar-JO',
  'ar-SA',
  'ar-AE',
  'bn-IN',
  'zh-CN',
  'zh-HK',
  'zh-TW',
  'nl-NL',
  'en-IN',
  'en-US',
  'fil-PH',
  'fr-FR',
  'de-DE',
  'gu-IN',
  'he-IL',
  'hi-IN',
  'id-ID',
  'it-IT',
  'ja-JP',
  'kn-IN',
  'ko-KR',
  'ms-MY',
  'fa-IR',
  'pt-PT',
  'ru-RU',
  'es-ES',
  'ta-IN',
  'te-IN',
  'th-TH',
  'tr-TR',
  'vi-VN',
] as const;

type SupportedInteractionLanguage =
  (typeof SUPPORTED_INTERACTION_LANGUAGES)[number];

type MurfVoiceConfigJson = {
  voice_id?: string;
  style?: string;
  model?: string;
};

type MurfRuntimeConfig = {
  voiceId?: string;
  model?: string;
  locale?: string;
  baseUrl?: string;
  rate?: number;
  pitch?: number;
  sampleRate?: number;
  style?: string;
};

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseMurfVoiceValue(value: string | undefined): MurfRuntimeConfig {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as MurfVoiceConfigJson;
    return {
      voiceId: parsed.voice_id,
      model: parsed.model,
      style: parsed.style,
    };
  } catch {
    return { voiceId: value };
  }
}

export function getInteractionLanguage(): SupportedInteractionLanguage {
  const language = process.env.AGORA_INTERACTION_LANGUAGE?.trim();

  if (
    language &&
    SUPPORTED_INTERACTION_LANGUAGES.includes(
      language as SupportedInteractionLanguage,
    )
  ) {
    return language as SupportedInteractionLanguage;
  }

  return 'en-IN';
}

export function getMurfRuntimeConfig(): MurfRuntimeConfig {
  const parsedVoiceValue = parseMurfVoiceValue(process.env.MURF_VOICE_ID);

  return {
    voiceId: process.env.MURF_TTS_VOICE_ID ?? parsedVoiceValue.voiceId,
    model: process.env.MURF_TTS_MODEL ?? parsedVoiceValue.model,
    locale: process.env.MURF_TTS_LOCALE,
    baseUrl: process.env.MURF_TTS_BASE_URL,
    rate: parseOptionalNumber(process.env.MURF_TTS_RATE),
    pitch: parseOptionalNumber(process.env.MURF_TTS_PITCH),
    sampleRate: parseOptionalNumber(process.env.MURF_TTS_SAMPLE_RATE),
    style: parsedVoiceValue.style,
  };
}
