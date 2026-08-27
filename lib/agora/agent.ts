import {
  Agent,
  AresSTT,
  ExpiresIn,
  MurfTTS,
  OpenAI,
} from 'agora-agents';
import { buildCharacterPrompt } from '@/lib/ai/promptBuilder';
import { getCharacterById } from '@/lib/characters';
import { createAgoraClient } from '@/lib/agora/server';
import { getInteractionLanguage, getMurfRuntimeConfig } from '@/lib/agora/runtimeConfig';

const DEFAULT_AGENT_UID = '123456';

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createCharacterAgent(input: {
  characterId: string;
  scene: 'eggs' | 'jungle' | 'globe';
  discoveries: number;
}) {
  const character = getCharacterById(input.characterId);

  if (!character) {
    throw new Error(`Unknown character: ${input.characterId}`);
  }

  const instructions = buildCharacterPrompt(character, {
    scene: input.scene,
    discoveries: input.discoveries,
  });

  const client = createAgoraClient();
  const murfConfig = getMurfRuntimeConfig();

  return new Agent({
    client,
    instructions,
    greeting: character.voiceIntro,
    failureMessage: character.redirectLine,
    maxHistory: 18,
    turnDetection: {
      // AgentKit copies turnDetection.language into the final ASR language.
      // Keep this configurable so live voice can be tuned without changing code.
      language: getInteractionLanguage(),
    },
    advancedFeatures: {
      enable_rtm: true,
    },
    parameters: {
      data_channel: 'rtm',
      enable_error_message: true,
      enable_metrics: true,
      audio_scenario: 'chorus',
    },
  })
    .withStt(
      new AresSTT(),
    )
    .withLlm(
      new OpenAI({
        model: 'gpt-4o-mini',
        greetingMessage: character.voiceIntro,
        failureMessage: character.redirectLine,
        maxHistory: 18,
        params: {
          max_tokens: 220,
          temperature: 0.6,
          top_p: 0.95,
        },
      }),
    )
    .withTts(
      new MurfTTS({
        key: requireEnv('MURF_API_KEY'),
        voiceId: murfConfig.voiceId,
        model: murfConfig.model,
        locale: murfConfig.locale,
        baseUrl: murfConfig.baseUrl,
        rate: murfConfig.rate,
        pitch: murfConfig.pitch,
        sampleRate: murfConfig.sampleRate,
      }),
    );
}

export async function startCharacterAgent(input: {
  characterId: string;
  scene: 'eggs' | 'jungle' | 'globe';
  channelName: string;
  requesterId: string;
  discoveries: number;
}) {
  const agent = createCharacterAgent({
    characterId: input.characterId,
    scene: input.scene,
    discoveries: input.discoveries,
  });

  const session = agent.createSession({
    channel: input.channelName,
    agentUid: process.env.NEXT_PUBLIC_AGENT_UID ?? DEFAULT_AGENT_UID,
    remoteUids: [input.requesterId],
    idleTimeout: 30,
    expiresIn: ExpiresIn.minutes(30),
    debug: false,
  });

  return session.start();
}

export async function stopCharacterAgent(agentId: string) {
  const client = createAgoraClient();
  await client.stopAgent(agentId);
}
