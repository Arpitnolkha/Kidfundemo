'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Compass, X } from 'lucide-react';
import { CharacterConversationExperience } from '@/components/characters/CharacterConversationExperience';
import { DiscoveryToast } from '@/components/ui/DiscoveryToast';
import { HatchSequence } from '@/components/eggs/HatchSequence';
import { playHatchCue } from '@/lib/audio/hatchSound';
import { eggCharacters } from '@/lib/characters/eggs';
import { useGameStore } from '@/lib/game/store';

const eggHotspots: Record<
  string,
  { left: string; top: string; width: string; height: string }
> = {
  'pip-chick': { left: '6%', top: '34%', width: '16%', height: '49%' },
  'tilly-turtle': { left: '24%', top: '34%', width: '16%', height: '49%' },
  'chomp-crocodile': { left: '42%', top: '34%', width: '16%', height: '49%' },
  'slinky-snake-egg': { left: '60%', top: '34%', width: '16%', height: '49%' },
  'lizzy-lizard': { left: '78%', top: '34%', width: '16%', height: '49%' },
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function EggScene() {
  const {
    hatchedEggIds,
    selectedEggId,
    currentCharacterId,
    conversationState,
    soundEnabled,
    discoveries,
    newDiscoveryId,
    lastSpokenLine,
    hatchEgg,
    selectEgg,
    setCurrentCharacter,
    setConversationState,
    setLastSpokenLine,
    toggleSound,
    addDiscovery,
    clearNewDiscovery,
    setMicrophoneState,
  } = useGameStore();
  const [hatchPhase, setHatchPhase] = useState<
    'idle' | 'wiggle' | 'crack' | 'open' | 'celebrate'
  >('idle');
  const [busyEggId, setBusyEggId] = useState<string | null>(null);
  const [isConversationOpen, setIsConversationOpen] = useState(false);

  const activeCharacter = useMemo(
    () =>
      eggCharacters.find(
        (character) => character.id === currentCharacterId || character.id === selectedEggId,
      ) ?? null,
    [currentCharacterId, selectedEggId],
  );

  const toastDiscovery = discoveries.find(
    (entry) => entry.entityId === newDiscoveryId,
  );

  const requestMicrophone = async () => {
    try {
      setMicrophoneState('requesting');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneState('granted');
      return true;
    } catch {
      setMicrophoneState('denied');
      return false;
    }
  };

  const openConversation = (characterId: string) => {
    const character = eggCharacters.find((entry) => entry.id === characterId);
    if (!character) return;

    selectEgg(null);
    setCurrentCharacter(characterId);
    setBusyEggId(null);
    setHatchPhase('idle');
    setLastSpokenLine(`${character.voiceIntro} ${character.voicePrompt}`);
    setIsConversationOpen(true);
    setConversationState('speaking');
    window.setTimeout(() => setConversationState('idle'), 900);
  };

  const hatchCharacter = async (characterId: string) => {
    const character = eggCharacters.find((entry) => entry.id === characterId);
    if (!character) return;

    if (hatchedEggIds.includes(characterId)) {
      openConversation(characterId);
      return;
    }

    selectEgg(characterId);
    setBusyEggId(characterId);
    setHatchPhase('wiggle');
    void playHatchCue('wiggle', soundEnabled);
    await wait(400);
    setHatchPhase('crack');
    void playHatchCue('crack', soundEnabled);
    await wait(450);
    setHatchPhase('open');
    void playHatchCue('open', soundEnabled);
    await wait(540);
    setHatchPhase('celebrate');
    hatchEgg(characterId);
    setCurrentCharacter(characterId);
    addDiscovery(character.discovery);
    setLastSpokenLine(`${character.voiceIntro} ${character.voicePrompt}`);
    await wait(1100);
    setHatchPhase('idle');
    setBusyEggId(null);
    selectEgg(null);
    setIsConversationOpen(true);
    setConversationState('speaking');
    await wait(900);
    setConversationState('idle');
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(255,247,204,0.86),_rgba(221,246,255,0.9)_46%,_rgba(166,220,182,0.95)_100%)] pb-16">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">
            <Compass className="h-4 w-4" />
            Discoveries: {discoveries.length}
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">
            Magical hatchery
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
            Who&apos;s Inside?
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
            Tap an egg to help it wiggle, crack, and hatch into a chatty baby animal.
            Each little friend knows its own world and loves short, curious questions.
          </p>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[30px] border border-white/55 bg-white/35 shadow-[0_40px_110px_rgba(42,63,43,0.18)] backdrop-blur sm:mt-10 sm:rounded-[42px]">
          <div className="relative aspect-[3/2] w-full">
            <Image
              src="/assets/scenes/eggs.png"
              alt="Who's Inside egg scene with five eggs children can tap."
              fill
              priority
              className="object-contain"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.15),transparent_40%)]" />
            {eggCharacters.map((character) => {
              const hotspot = eggHotspots[character.id];
              const activeHatch = busyEggId === character.id;

              return (
                <button
                  key={character.id}
                  type="button"
                  aria-label={`${character.eggLabel} hotspot`}
                  disabled={Boolean(busyEggId && busyEggId !== character.id)}
                  onClick={() => hatchCharacter(character.id)}
                  className="absolute rounded-[1.5rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80 sm:rounded-[2rem]"
                  style={hotspot}
                >
                  <span
                    className={`absolute inset-0 rounded-[1.5rem] transition sm:rounded-[2rem] ${
                      activeHatch
                        ? 'bg-white/10 ring-4 ring-amber-300/70'
                        : 'bg-transparent hover:bg-white/8'
                    }`}
                  />
                  <span
                    className={`absolute inset-[8%] rounded-[1.5rem] transition sm:rounded-[2rem] ${
                      activeHatch ? 'animate-egg-wobble border-2 border-white/70' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {busyEggId ? (
            <HatchSequence
              character={
                eggCharacters.find((character) => character.id === busyEggId)!
              }
              phase={hatchPhase}
              hotspot={eggHotspots[busyEggId]}
            />
          ) : null}
        </div>
      </section>

      {activeCharacter && isConversationOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(43,58,52,0.14)] px-3 py-4 backdrop-blur-sm backdrop-brightness-110 sm:px-4 sm:py-6">
          <div className="relative mx-auto w-full max-w-6xl">
            <button
              type="button"
              aria-label="Close conversation"
              onClick={() => {
                setIsConversationOpen(false);
                selectEgg(null);
                setCurrentCharacter(null);
                setConversationState('idle');
              }}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80 sm:right-4 sm:top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <CharacterConversationExperience
              character={activeCharacter}
              scene="eggs"
              transcript={lastSpokenLine}
              onTranscriptChange={setLastSpokenLine}
              status={conversationState}
              onStatusChange={setConversationState}
              soundEnabled={soundEnabled}
              onToggleSound={toggleSound}
              onRequestMic={requestMicrophone}
              devPanel={process.env.NEXT_PUBLIC_SHOW_DEV_PANEL === 'true'}
              discoveries={discoveries.length}
              onClose={() => {
                setIsConversationOpen(false);
                selectEgg(null);
                setCurrentCharacter(null);
                setConversationState('idle');
              }}
            />
          </div>
        </div>
      ) : null}

      {toastDiscovery ? (
        <DiscoveryToast
          title={toastDiscovery.title}
          summary={toastDiscovery.summary}
          onDone={clearNewDiscovery}
        />
      ) : null}
    </main>
  );
}
