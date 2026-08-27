'use client';

import dynamic from 'next/dynamic';

const GlobeExplorer = dynamic(
  () => import('@/components/globe/GlobeExplorer').then((module) => module.GlobeExplorer),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#061d36] text-white">
        <div className="text-center">
          <div className="text-7xl" aria-hidden="true">🌍</div>
          <p className="mt-4 text-xl font-black">Preparing your world adventure...</p>
        </div>
      </main>
    ),
  },
);

export function GlobePageClient() {
  return <GlobeExplorer />;
}
