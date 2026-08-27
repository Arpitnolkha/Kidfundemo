'use client';

import { cn } from '@/lib/utils';
import type { VoiceState } from '@/lib/game/store';

const labels: Record<VoiceState, string> = {
  idle: 'Ready to listen',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  error: 'Need a retry',
};

export function VoiceStatus({
  state,
  mode,
}: {
  state: VoiceState;
  mode: 'demo' | 'live';
}) {
  return (
    <div className="inline-flex min-h-11 flex-wrap items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur sm:gap-3 sm:px-4 sm:text-sm">
      <span
        className={cn(
          'h-3 w-3 rounded-full',
          state === 'listening' && 'bg-emerald-500 animate-pulse',
          state === 'thinking' && 'bg-amber-400 animate-pulse',
          state === 'speaking' && 'bg-sky-500 animate-pulse',
          state === 'error' && 'bg-rose-500',
          state === 'idle' && 'bg-slate-300',
        )}
      />
      <span>{labels[state]}</span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
        {mode}
      </span>
    </div>
  );
}
