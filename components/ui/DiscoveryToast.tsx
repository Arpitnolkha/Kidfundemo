'use client';

import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export function DiscoveryToast({
  title,
  summary,
  eyebrow = 'New discovery!',
  onDone,
}: {
  title: string;
  summary: string;
  eyebrow?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDone, 2500);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  return (
    <div className="animate-fade-up fixed left-1/2 top-6 z-50 w-[min(92vw,24rem)] -translate-x-1/2 rounded-[28px] border border-white/65 bg-amber-50/95 px-5 py-4 text-slate-800 shadow-[0_22px_55px_rgba(171,120,28,0.2)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-amber-200/80 p-2 text-amber-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            {eyebrow}
          </p>
          <p className="text-base font-bold">{title}</p>
          <p className="text-sm text-slate-600">{summary}</p>
        </div>
      </div>
    </div>
  );
}
