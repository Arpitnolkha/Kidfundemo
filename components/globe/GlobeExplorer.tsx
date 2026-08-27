'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterConversationExperience } from '@/components/characters/CharacterConversationExperience';
import { AmChartsGlobe, type AmChartsGlobeHandle } from '@/components/globe/AmChartsGlobe';
import { CountryPicker } from '@/components/globe/CountryPicker';
import { globeCountryGuides, globeCountryGuidesByIso2 } from '@/lib/globe/countries';
import { getGlobeCountryOptions } from '@/lib/globe/geo';
import { useGlobeStore } from '@/lib/globe/store';
import { useGameStore } from '@/lib/game/store';
import type { GlobeCountryGuide } from '@/lib/globe/types';

export function GlobeExplorer() {
  const countries = useMemo(() => getGlobeCountryOptions(), []);
  const globeRef = useRef<AmChartsGlobeHandle>(null);
  const idleTimerRef = useRef<number | null>(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [globeError, setGlobeError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highlightedCountryId, setHighlightedCountryId] = useState<string | null>(null);
  const [activeGuide, setActiveGuide] = useState<GlobeCountryGuide | null>(null);
  const [unavailableCountry, setUnavailableCountry] = useState<string | null>(null);
  const [debugGlobe, setDebugGlobe] = useState(false);

  const {
    selectedCountryId,
    visitedCountryIds,
    autoRotate,
    isDragging,
    openCountry,
    closeCountry,
    markVisited,
    setAutoRotate,
    setDragging,
  } = useGlobeStore();
  const {
    conversationState,
    soundEnabled,
    lastSpokenLine,
    discoveries,
    setCurrentCharacter,
    setConversationState,
    setLastSpokenLine,
    setMicrophoneState,
    toggleSound,
    addDiscovery,
  } = useGameStore();

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    updateMotion();
    motionQuery.addEventListener('change', updateMotion);
    setDebugGlobe(new URLSearchParams(window.location.search).get('debugGlobe') === 'true');
    return () => motionQuery.removeEventListener('change', updateMotion);
  }, []);

  useEffect(
    () => () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    },
    [],
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

  const chooseCountry = useCallback(
    (countryId: string, countryName: string) => {
      const guide = globeCountryGuidesByIso2[countryId];
      openCountry(countryId);
      setHighlightedCountryId(countryId);
      setUnavailableCountry(null);
      globeRef.current?.selectCountry(countryId, true);

      if (!guide) {
        setActiveGuide(null);
        setCurrentCharacter(null);
        setUnavailableCountry(countryName);
        return;
      }

      markVisited(countryId);
      addDiscovery(guide.discovery);
      setCurrentCharacter(guide.id);
      setLastSpokenLine(`${guide.voiceIntro} ${guide.voicePrompt}`);
      setConversationState('speaking');
      setActiveGuide(guide);
      window.setTimeout(() => setConversationState('idle'), 650);
    },
    [
      addDiscovery,
      markVisited,
      openCountry,
      setConversationState,
      setCurrentCharacter,
      setLastSpokenLine,
    ],
  );

  const closeConversation = useCallback(() => {
    setActiveGuide(null);
    closeCountry();
    setCurrentCharacter(null);
    setConversationState('idle');
  }, [closeCountry, setConversationState, setCurrentCharacter]);

  const handleDragState = useCallback(
    (dragging: boolean) => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (dragging) {
        setDragging(true);
      } else if (autoRotate) {
        idleTimerRef.current = window.setTimeout(() => setDragging(false), 1200);
      } else {
        setDragging(false);
      }
    },
    [autoRotate, setDragging],
  );

  const guideCount = visitedCountryIds.filter((countryId) =>
    Boolean(globeCountryGuidesByIso2[countryId]),
  ).length;
  const renderedSelectedCountryId = selectedCountryId ?? highlightedCountryId;
  const globeDiscoveries = discoveries.filter((discovery) =>
    discovery.entityId.startsWith('country-'),
  ).length;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#061d36] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(38,142,195,0.32),transparent_34%),radial-gradient(circle_at_10%_10%,rgba(43,173,156,0.18),transparent_28%),linear-gradient(180deg,#092944_0%,#06172d_62%,#041121_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[96rem] flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <header className="z-20 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/95 px-5 py-3 text-sm font-black text-slate-800 shadow-[0_14px_34px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <div className="flex items-center gap-2">
            <div className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-bold text-cyan-50 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300" />
              {guideCount} / {globeCountryGuides.length} guides visited
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
              aria-label={soundEnabled ? 'Sound on' : 'Sound off'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <section className="relative z-10 mt-4 flex min-h-0 flex-1 flex-col items-center lg:mt-1">
          <div className="pointer-events-none max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">A world of stories</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Explore the World</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-blue-100/85 sm:text-base">
              Spin the globe, choose a country, and talk with a friendly guide.
            </p>
          </div>

          <div className="relative mt-2 h-[clamp(18rem,48dvh,36rem)] w-full max-w-6xl overflow-hidden rounded-[36px] border border-cyan-100/15 bg-[#06172d]/35 shadow-[0_32px_100px_rgba(0,0,0,0.42)] sm:mt-4 lg:h-[clamp(21rem,62dvh,43rem)]">
            <AmChartsGlobe
              ref={globeRef}
              autoRotate={autoRotate && !isDragging && !activeGuide}
              reducedMotion={reducedMotion}
              onSelect={chooseCountry}
              onDragStateChange={handleDragState}
              onReady={() => {
                setGlobeError(null);
                setIsGlobeReady(true);
              }}
              onError={(message) => {
                setGlobeError(message);
                setIsGlobeReady(false);
              }}
            />

            {!isGlobeReady && !globeError ? (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#06172d]/70 text-center backdrop-blur-sm">
                <div>
                  <div className="text-6xl" aria-hidden="true">🌍</div>
                  <p className="mt-4 text-lg font-black text-blue-50">Getting the world ready...</p>
                </div>
              </div>
            ) : null}

            {globeError ? (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#06172d] px-6 text-center">
                <div className="text-7xl" aria-hidden="true">🌍</div>
                <h2 className="mt-5 text-2xl font-black">The globe needs a little more browser magic</h2>
                <p className="mt-3 max-w-md text-blue-100/80">You can still choose any country with the country picker below.</p>
                {debugGlobe ? <p className="mt-3 font-mono text-xs text-rose-200">{globeError}</p> : null}
              </div>
            ) : null}

            <div className="absolute inset-y-0 left-3 z-10 flex items-center sm:left-5">
              <button
                type="button"
                onClick={() => globeRef.current?.rotateHorizontal('left')}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-xl transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 sm:h-14 sm:w-14"
                aria-label="Rotate globe left"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-3 z-10 flex items-center sm:right-5">
              <button
                type="button"
                onClick={() => globeRef.current?.rotateHorizontal('right')}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-xl transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 sm:h-14 sm:w-14"
                aria-label="Rotate globe right"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className="absolute bottom-4 left-1/2 z-10 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-[#082742]/90 px-4 py-2 text-sm font-black text-white shadow-xl backdrop-blur focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
              aria-label={autoRotate ? 'Pause globe rotation' : 'Resume globe rotation'}
            >
              {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {autoRotate ? 'Pause' : 'Spin'}
            </button>

            {unavailableCountry ? (
              <div className="absolute inset-x-4 top-4 z-30 mx-auto flex max-w-md items-start justify-between gap-3 rounded-[24px] bg-[#fff8df] px-5 py-4 text-slate-800 shadow-2xl">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">More adventures coming soon</p>
                  <p className="mt-1 font-bold">{unavailableCountry} is on the map, but its talking guide is still packing!</p>
                </div>
                <button type="button" onClick={() => setUnavailableCountry(null)} aria-label="Close country message" className="shrink-0 rounded-full p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : null}

            {debugGlobe ? (
              <div className="absolute bottom-4 right-4 z-20 rounded-2xl bg-slate-950/80 p-3 font-mono text-[11px] text-cyan-100">
                <div>countries: {countries.length}</div>
                <div>selected: {renderedSelectedCountryId ?? 'none'}</div>
                <div>guides: {globeCountryGuides.length}</div>
                <div>visited: {globeDiscoveries}</div>
                <div>popup: {activeGuide ? 'open' : 'closed'}</div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex w-full max-w-3xl flex-col items-stretch gap-3 rounded-[28px] bg-[#eaf9ff] p-3 text-slate-800 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:flex-row sm:items-center sm:p-4">
            <CountryPicker countries={countries} selectedCountryId={selectedCountryId} onSelect={chooseCountry} />
            <button
              type="button"
              onClick={() => {
                setHighlightedCountryId(null);
                closeCountry();
                setUnavailableCountry(null);
                globeRef.current?.clearSelection();
              }}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-700 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
            >
              <RotateCcw className="h-4 w-4" />
              Clear choice
            </button>
          </div>
        </section>
      </div>

      {activeGuide ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(4,20,34,0.28)] px-3 py-4 backdrop-blur-sm backdrop-brightness-110 sm:px-4 sm:py-6">
          <div className="relative mx-auto w-full max-w-6xl">
            <button
              type="button"
              aria-label="Close conversation"
              onClick={closeConversation}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 sm:right-4 sm:top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <CharacterConversationExperience
              character={activeGuide}
              scene="globe"
              transcript={lastSpokenLine}
              status={conversationState}
              soundEnabled={soundEnabled}
              onTranscriptChange={setLastSpokenLine}
              onStatusChange={setConversationState}
              onToggleSound={toggleSound}
              onRequestMic={requestMicrophone}
              devPanel={process.env.NEXT_PUBLIC_SHOW_DEV_PANEL === 'true'}
              discoveries={guideCount}
              onClose={closeConversation}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
