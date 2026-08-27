'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import type { EggCharacter } from '@/lib/characters/types';

export function HatchSequence({
  character,
  phase,
  hotspot,
}: {
  character: EggCharacter;
  phase: 'idle' | 'wiggle' | 'crack' | 'open' | 'celebrate';
  hotspot: { left: string; top: string; width: string; height: string };
}) {
  if (phase === 'idle') return null;

  const shellOpen = phase === 'open' || phase === 'celebrate';
  const creatureVisible = phase === 'open' || phase === 'celebrate';
  const crackVisible = phase === 'crack' || phase === 'open' || phase === 'celebrate';
  const sparkleVisible = phase === 'open' || phase === 'celebrate';
  const shardVisible = phase === 'celebrate';
  const creatureLiftClass =
    phase === 'celebrate'
      ? '-translate-y-4 scale-[1.08] opacity-100 animate-float-character'
      : creatureVisible
        ? 'translate-y-0 scale-100 opacity-100'
        : 'translate-y-10 scale-75 opacity-0';

  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute"
        style={{
          left: hotspot.left,
          top: hotspot.top,
          width: hotspot.width,
          height: hotspot.height,
        }}
      >
        <div className="relative h-full w-full">
          <div
            className={`absolute inset-[10%] origin-bottom transition duration-300 ${
              phase === 'wiggle' ? 'animate-egg-wobble' : ''
            }`}
          >
            <div
              className={`absolute left-[10%] top-[4%] h-[58%] w-[34%] rounded-[48%_52%_38%_42%/56%_58%_40%_42%] border-4 border-white/70 shadow-[0_16px_40px_rgba(59,40,16,0.18)] transition duration-500 ${
                shellOpen ? '-translate-x-[24%] rotate-[-26deg]' : ''
              }`}
              style={{
                background: `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.95), ${character.palette.shell} 58%, ${character.palette.accent} 140%)`,
              }}
            />
            <div
              className={`absolute right-[10%] top-[4%] h-[58%] w-[34%] rounded-[52%_48%_42%_38%/58%_56%_42%_40%] border-4 border-white/70 shadow-[0_16px_40px_rgba(59,40,16,0.18)] transition duration-500 ${
                shellOpen ? 'translate-x-[24%] rotate-[26deg]' : ''
              }`}
              style={{
                background: `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.95), ${character.palette.shell} 58%, ${character.palette.accent} 140%)`,
              }}
            />
            <div
              className={`absolute bottom-[14%] left-[18%] h-[18%] w-[64%] rounded-[40%] border-4 border-white/70 shadow-[0_12px_28px_rgba(59,40,16,0.16)] transition duration-500 ${
                shellOpen ? 'translate-y-[12%]' : ''
              }`}
              style={{
                background: `linear-gradient(180deg, ${character.palette.shell}, ${character.palette.accent})`,
              }}
            />

            {crackVisible ? (
              <>
                <div className="absolute left-1/2 top-[16%] h-[44%] w-[3px] -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
                <div className="absolute left-[43%] top-[20%] h-[9%] w-[3px] rotate-[28deg] rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
                <div className="absolute left-[51%] top-[29%] h-[10%] w-[3px] rotate-[-32deg] rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
                <div className="absolute left-[45%] top-[38%] h-[8%] w-[3px] rotate-[22deg] rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.65)]" />
              </>
            ) : null}
          </div>

          {sparkleVisible ? (
            <>
              <div className="animate-hatch-sparkle absolute left-[24%] top-[18%] h-4 w-4 rounded-full bg-amber-200/80 blur-[1px]" />
              <div className="animate-hatch-sparkle absolute left-[68%] top-[20%] h-3 w-3 rounded-full bg-yellow-100/85 blur-[1px] [animation-delay:100ms]" />
              <div className="animate-hatch-sparkle absolute left-[34%] top-[8%] h-3.5 w-3.5 rounded-full bg-white/90 blur-[1px] [animation-delay:140ms]" />
            </>
          ) : null}

          {shardVisible ? (
            <>
              <div
                className="animate-shell-shard absolute left-[18%] top-[58%] h-5 w-6 rounded-[45%_55%_65%_35%/58%_48%_52%_42%] border border-white/70"
                style={{
                  background: `linear-gradient(180deg, ${character.palette.shell}, ${character.palette.accent})`,
                  ['--shard-rotate' as string]: '-40deg',
                }}
              />
              <div
                className="animate-shell-shard absolute left-[68%] top-[56%] h-5 w-6 rounded-[52%_48%_36%_64%/58%_48%_52%_42%] border border-white/70 [animation-delay:60ms]"
                style={{
                  background: `linear-gradient(180deg, ${character.palette.shell}, ${character.palette.accent})`,
                  ['--shard-rotate' as string]: '42deg',
                }}
              />
            </>
          ) : null}

          <div
            className={`absolute left-1/2 top-[8%] -translate-x-1/2 transition duration-500 ${creatureLiftClass}`}
          >
            {character.imageSrc ? (
              <div className="relative h-36 w-36 overflow-hidden rounded-[28px] shadow-[0_22px_46px_rgba(34,52,78,0.2)]">
                <Image
                  src={character.imageSrc}
                  alt={character.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="text-[3.8rem]">{character.emoji}</div>
            )}
          </div>

          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 rounded-full bg-amber-50/90 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700 shadow-sm">
            {phase === 'wiggle' && 'Wiggle'}
            {phase === 'crack' && 'Crack'}
            {phase === 'open' && 'Hatching'}
            {phase === 'celebrate' && `${character.name}!`}
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-[8%] -translate-x-1/2 rounded-[36px] border border-white/60 bg-white/78 px-5 py-3 text-center shadow-[0_24px_70px_rgba(37,52,89,0.16)] backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">
          {phase === 'wiggle' && 'Wiggle wiggle'}
          {phase === 'crack' && 'Crack crack'}
          {phase === 'open' && 'Shell opening'}
          {phase === 'celebrate' && 'Hooray!'}
        </p>
        <p className="mt-1 text-base font-bold text-slate-900">
          {character.name} {character.hatchVerb}!
        </p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700">
          <Sparkles className="h-4 w-4" />
          Cracking sound and hatch magic
        </div>
      </div>
    </div>
  );
}
