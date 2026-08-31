'use client';

import { useEffect, useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { VoiceStatus } from '@/components/audio/VoiceStatus';
import { SoundToggle } from '@/components/audio/SoundToggle';
import { LipSyncCharacter } from '@/components/characters/LipSyncCharacter';
import { SuggestedQuestions } from '@/components/ui/SuggestedQuestions';
import { buildMockReply } from '@/lib/game/mockConversation';
import type { LearningCharacter } from '@/lib/characters/types';
import type { VoiceState } from '@/lib/game/store';

export function CharacterStage({
  character,
  mode,
  transcript,
  onTranscriptChange,
  status,
  onStatusChange,
  soundEnabled,
  onToggleSound,
  onRequestMic,
  devPanel,
}: {
  character: LearningCharacter;
  mode: 'demo' | 'live';
  transcript: string;
  onTranscriptChange: (line: string) => void;
  status: VoiceState;
  onStatusChange: (state: VoiceState) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRequestMic: () => Promise<boolean>;
  devPanel: boolean;
}) {
  const [mouthOpen, setMouthOpen] = useState(0.2);
  const [devQuestion, setDevQuestion] = useState('');
  const hasImage = Boolean(character.imageSrc);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMouthOpen((current) =>
        status === 'speaking' ? (current > 0.7 ? 0.28 : 0.85) : 0.14,
      );
    }, 240);
    return () => window.clearInterval(interval);
  }, [status]);

  const answerQuestion = (question: string) => {
    onStatusChange('thinking');
    const reply = buildMockReply(character, question);
    window.setTimeout(() => {
      onTranscriptChange(reply);
      onStatusChange('speaking');
      window.setTimeout(() => onStatusChange('idle'), 700);
    }, 300);
  };

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/72 p-4 shadow-[0_30px_70px_rgba(31,41,87,0.18)] backdrop-blur sm:rounded-[32px] sm:p-5 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <VoiceStatus mode={mode} state={status} />
          <SoundToggle enabled={soundEnabled} onToggle={onToggleSound} />
        </div>
        <p className="max-w-xl text-sm font-medium leading-6 text-slate-600">
          {mode === 'live'
            ? 'Live Agora session routes are wired for one active character at a time.'
            : 'Demo mode keeps the experience testable without starting live Agora sessions.'}
        </p>
      </div>

      <div className={`mt-5 grid gap-5 lg:mt-6 lg:items-center ${hasImage ? 'lg:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)] lg:gap-6' : 'mx-auto w-full max-w-[44rem] grid-cols-1'}`}>
        <div className={hasImage ? '' : 'text-center'}>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-800">
            <Sparkles className="h-3.5 w-3.5" />
            {character.category}
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl md:text-4xl">
            {character.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
            {character.personality}
          </p>
          <div className="mt-5 rounded-[22px] bg-slate-900/85 p-4 text-white shadow-inner sm:rounded-[28px] sm:p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
              Current line
            </p>
            <p className="mt-2 text-base leading-7 sm:text-lg sm:leading-8">
              {transcript || `${character.voiceIntro} ${character.voicePrompt}`}
            </p>
          </div>

          <div className={`mt-5 flex flex-wrap gap-3 ${hasImage ? '' : 'justify-center'}`}>
            <button
              type="button"
              onClick={async () => {
                const granted = await onRequestMic();
                onStatusChange(granted ? 'listening' : 'error');
                if (!granted) {
                  onTranscriptChange(
                    "Microphone magic isn't working right now. Let's try again!",
                  );
                }
              }}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-rose-300 px-5 py-3 text-sm font-black text-slate-900 shadow-[0_16px_30px_rgba(255,171,69,0.35)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400"
            >
              <Mic className="h-4 w-4" />
              Ask with your microphone
            </button>
          </div>

          <div className="mt-6">
            <SuggestedQuestions
              questions={character.starterQuestions.slice(0, 4)}
              onAsk={answerQuestion}
            />
          </div>

          {devPanel ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Developer test panel
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={devQuestion}
                  onChange={(event) => setDevQuestion(event.target.value)}
                  className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Type a test question for demo mode"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!devQuestion.trim()) return;
                    answerQuestion(devQuestion.trim());
                    setDevQuestion('');
                  }}
                  className="rounded-full bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                >
                  Send
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {hasImage ? (
          <div className="order-first flex justify-center lg:order-none lg:justify-end">
            <LipSyncCharacter
              emoji={character.emoji}
              imageSrc={character.imageSrc}
              name={character.name}
              palette={character.palette}
              mouthOpen={mouthOpen}
              speaking={status === 'speaking'}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
