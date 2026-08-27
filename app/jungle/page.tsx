import { Suspense } from 'react';
import { JungleScene } from '@/components/jungle/JungleScene';

export default function JunglePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#1f513d] text-white">
          <p className="text-xl font-black">Growing the jungle...</p>
        </main>
      }
    >
      <JungleScene />
    </Suspense>
  );
}
