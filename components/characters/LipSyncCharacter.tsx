'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function LipSyncCharacter({
  emoji,
  imageSrc,
  name,
  palette,
  mouthOpen,
  speaking,
  size = 'large',
}: {
  emoji: string;
  imageSrc?: string;
  name: string;
  palette: {
    shell: string;
    body: string;
    accent: string;
    glow: string;
  };
  mouthOpen: number;
  speaking: boolean;
  size?: 'medium' | 'large';
}) {
  return (
    <div
      className={cn(
        'relative flex aspect-square items-center justify-center overflow-hidden rounded-[28px] shadow-[0_28px_60px_rgba(37,52,89,0.2)] sm:rounded-[36px]',
        imageSrc ? 'border-0' : 'border border-white/50',
        size === 'large'
          ? 'w-full max-w-[15rem] sm:max-w-[18rem] lg:max-w-[20rem]'
          : 'w-full max-w-[10rem] sm:max-w-[12rem]',
      )}
      style={{
        background: imageSrc
          ? `radial-gradient(circle at 35% 30%, ${palette.glow}, rgba(255,255,255,0.18) 58%, rgba(255,255,255,0.08) 100%)`
          : `radial-gradient(circle at 35% 30%, ${palette.glow}, rgba(255,255,255,0.88) 58%, rgba(255,255,255,0.74) 100%)`,
      }}
      aria-label={name}
    >
      <div
        className={cn(
          imageSrc
            ? 'absolute inset-0 overflow-hidden rounded-[28px] transition-transform duration-300 sm:rounded-[36px]'
            : 'absolute inset-3 overflow-hidden rounded-[24px] transition-transform duration-300 sm:inset-4 sm:rounded-[30px]',
          speaking && 'animate-float-character',
        )}
        style={{
          background: imageSrc
            ? `radial-gradient(circle at 50% 100%, ${palette.glow}, rgba(255,255,255,0.92) 72%)`
            : `linear-gradient(180deg, ${palette.body}, ${palette.shell})`,
        }}
      >
        {imageSrc ? (
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt={name}
              fill
              className="object-cover object-center"
            />
          </div>
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center">
            <div
              className={cn(
                size === 'large'
                  ? 'text-[4.75rem] sm:text-[5.75rem] lg:text-[7rem]'
                  : 'text-[3.25rem] sm:text-[4rem]',
              )}
            >
              {emoji}
            </div>
            <div className="mt-2 flex items-center gap-3 sm:gap-4">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800 sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800 sm:h-3 sm:w-3" />
            </div>
            <div
              className="mt-3 rounded-full bg-slate-800 transition-all duration-100"
              style={{
                width: `${24 + mouthOpen * 16}px`,
                height: `${8 + mouthOpen * 18}px`,
                borderRadius: `${30 - mouthOpen * 14}px`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
