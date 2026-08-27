'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { CharacterConversationExperience } from '@/components/characters/CharacterConversationExperience';
import { DiscoveryToast } from '@/components/ui/DiscoveryToast';
import {
  jungleCharacters,
  jungleCharactersById,
  jungleCharacterIds,
} from '@/lib/characters/jungle';
import { useGameStore } from '@/lib/game/store';
import { jungleScenes } from '@/lib/jungle/scenes';
import type { JungleHotspot, JungleSceneId } from '@/lib/jungle/types';

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function JungleScene() {
  const searchParams = useSearchParams();
  const debugHotspots = searchParams.get('debugHotspots') === 'true';
  const {
    activeJungleEntityId,
    currentCharacterId,
    currentJungleScene,
    isJungleTransitioning,
    conversationState,
    soundEnabled,
    discoveries,
    newDiscoveryId,
    lastSpokenLine,
    selectJungleEntity,
    goToJungleScene,
    setJungleTransitioning,
    setCurrentCharacter,
    setConversationState,
    setLastSpokenLine,
    toggleSound,
    addDiscovery,
    clearNewDiscovery,
    setMicrophoneState,
  } = useGameStore();
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'out' | 'in'>(
    'idle',
  );

  useEffect(() => {
    goToJungleScene('scene1');
    setJungleTransitioning(false);
    selectJungleEntity(null);
    setCurrentCharacter(null);
    setConversationState('idle');
    setLastSpokenLine('');
  }, [
    goToJungleScene,
    selectJungleEntity,
    setConversationState,
    setCurrentCharacter,
    setJungleTransitioning,
    setLastSpokenLine,
  ]);

  const activeCharacter = useMemo(
    () =>
      jungleCharacters.find(
        (character) =>
          character.id === currentCharacterId ||
          character.id === activeJungleEntityId,
      ) ?? null,
    [activeJungleEntityId, currentCharacterId],
  );

  const scene = jungleScenes[currentJungleScene];
  const jungleDiscoveries = useMemo(
    () =>
      discoveries.filter((entry) => jungleCharacterIds.includes(entry.entityId)),
    [discoveries],
  );
  const toastDiscovery = useMemo(() => {
    if (!newDiscoveryId || !jungleCharacterIds.includes(newDiscoveryId)) return null;
    return discoveries.find((entry) => entry.entityId === newDiscoveryId) ?? null;
  }, [discoveries, newDiscoveryId]);
  const discoveredCount = jungleDiscoveries.length;
  const totalDiscoveries = jungleCharacterIds.length;
  const interactionDisabled = isConversationOpen || isJungleTransitioning;

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

  const closeConversation = () => {
    setIsConversationOpen(false);
    selectJungleEntity(null);
    setCurrentCharacter(null);
    setConversationState('idle');
  };

  const openEntity = (entityId: string) => {
    const character = jungleCharactersById[entityId];
    if (!character) return;

    selectJungleEntity(entityId);
    setCurrentCharacter(entityId);
    addDiscovery(character.discovery);
    setLastSpokenLine(`${character.voiceIntro} ${character.voicePrompt}`);
    setIsConversationOpen(true);
    setConversationState('speaking');
    window.setTimeout(() => setConversationState('idle'), 650);
  };

  const navigateToScene = async (targetScene: JungleSceneId) => {
    if (interactionDisabled) return;

    setJungleTransitioning(true);
    setTransitionPhase('out');
    await wait(360);
    goToJungleScene(targetScene);
    setTransitionPhase('in');
    await wait(420);
    setTransitionPhase('idle');
    setJungleTransitioning(false);
  };

  const handleHotspot = (hotspot: JungleHotspot) => {
    if (hotspot.type === 'entity' && hotspot.entityId) {
      openEntity(hotspot.entityId);
    }

    if (hotspot.type === 'navigation' && hotspot.targetScene) {
      void navigateToScene(hotspot.targetScene);
    }
  };

  const sceneMotionClass =
    transitionPhase === 'out'
      ? 'scale-[1.04] blur-[2px] opacity-60'
      : transitionPhase === 'in'
        ? 'scale-[1.015] opacity-100'
        : 'scale-100 opacity-100';

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#e6fbff_0%,#c8f4d7_18%,#58a96f_62%,#1f513d_100%)] pb-12">
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-6 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {discoveredCount} / {totalDiscoveries}
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80"
              aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-900/75">
              Jungle walk
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
              The Talking Jungle
            </h1>
            <p className="mt-4 text-lg leading-8 text-emerald-50/92">
              Explore one picture-book scene at a time, meet hidden jungle friends,
              and follow the path deeper into the rainforest.
            </p>
          </div>

          <div className="rounded-full bg-white/18 px-4 py-2 text-sm font-bold text-emerald-50 backdrop-blur">
            Scene {scene.id.replace('scene', '')}: {scene.name}
          </div>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[30px] border border-white/30 bg-white/10 shadow-[0_44px_120px_rgba(11,35,22,0.35)] backdrop-blur-sm sm:rounded-[44px]">
          <div
            className={`relative aspect-[3/2] w-full transition-[transform,filter,opacity] duration-500 ${sceneMotionClass}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            <Image
              src={scene.image}
              alt={`${scene.name} jungle scene with hidden discoveries.`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-contain"
            />

            {scene.hotspots.map((hotspot) => {
              const isEntityHotspot = hotspot.type === 'entity';
              const buttonLabel =
                isEntityHotspot
                  ? jungleCharactersById[hotspot.entityId!]?.title ?? hotspot.label
                  : hotspot.label;

              return (
                <button
                  key={hotspot.id}
                  type="button"
                  disabled={interactionDisabled}
                  aria-label={buttonLabel}
                  onClick={() => handleHotspot(hotspot)}
                  className="group absolute touch-manipulation focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80 disabled:pointer-events-none"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                    borderRadius: hotspot.rounded ?? '24px',
                  }}
                >
                  {debugHotspots ? (
                    <span className="absolute inset-0 rounded-[inherit] border-2 border-amber-200/95 bg-emerald-400/20 text-left text-[10px] font-bold text-white shadow-[0_0_0_2px_rgba(15,23,42,0.18)] sm:text-xs">
                      <span className="absolute left-1 top-1 rounded-xl bg-slate-900/70 px-2 py-1 leading-tight">
                        {hotspot.label}
                        <br />
                        x: {hotspot.x} y: {hotspot.y}
                        <br />
                        w: {hotspot.width} h: {hotspot.height}
                      </span>
                    </span>
                  ) : (
                    <span
                      className={`absolute inset-0 rounded-[inherit] transition duration-200 ${
                        isEntityHotspot
                          ? 'bg-transparent group-hover:bg-white/8 group-hover:shadow-[0_0_24px_rgba(255,255,255,0.16)] group-active:animate-pulse group-focus-visible:bg-white/8'
                          : 'bg-white/0 group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.18)] group-active:animate-pulse group-focus-visible:bg-white/10'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            {currentJungleScene === 'scene7' && !isConversationOpen ? (
              <div className="absolute inset-x-3 bottom-3 sm:inset-x-6 sm:bottom-6">
                <div className="ml-auto w-full max-w-[28rem] rounded-[28px] bg-white/88 px-5 py-4 text-slate-800 shadow-[0_24px_60px_rgba(36,56,43,0.25)] backdrop-blur">
                  {discoveredCount === totalDiscoveries ? (
                    <>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                        Jungle Explorer!
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">
                        You found all the Jungle friends!
                      </h2>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                        Hidden Waterfall
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-900">
                        You discovered {discoveredCount} of {totalDiscoveries} Jungle friends.
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Want to explore again and find the others?
                      </p>
                    </>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => goToJungleScene('scene1')}
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(16,121,80,0.28)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                    >
                      Explore Again
                    </button>
                    <Link
                      href="/"
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-[0_14px_30px_rgba(36,56,43,0.16)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
                    >
                      Back Home
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {activeCharacter && isConversationOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(43,58,52,0.14)] px-3 py-4 backdrop-blur-sm backdrop-brightness-110 sm:px-4 sm:py-6">
          <div className="relative mx-auto w-full max-w-6xl">
            <button
              type="button"
              aria-label="Close conversation"
              onClick={closeConversation}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/80 sm:right-4 sm:top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <CharacterConversationExperience
              character={activeCharacter}
              scene="jungle"
              transcript={lastSpokenLine}
              status={conversationState}
              soundEnabled={soundEnabled}
              onTranscriptChange={setLastSpokenLine}
              onStatusChange={setConversationState}
              onToggleSound={toggleSound}
              onRequestMic={requestMicrophone}
              devPanel={process.env.NEXT_PUBLIC_SHOW_DEV_PANEL === 'true'}
              discoveries={discoveredCount}
              onClose={closeConversation}
            />
          </div>
        </div>
      ) : null}

      {toastDiscovery ? (
        <DiscoveryToast
          title={toastDiscovery.title}
          summary={toastDiscovery.summary}
          eyebrow="New Jungle Friend!"
          onDone={clearNewDiscovery}
        />
      ) : null}
    </main>
  );
}
