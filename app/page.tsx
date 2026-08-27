import Link from 'next/link';
import { Sparkles, Trees } from 'lucide-react';

const adventures = [
  {
    href: '/eggs',
    icon: '🥚',
    eyebrow: 'Tap to hatch',
    title: "Who's Inside?",
    description:
      'Wiggle five magical eggs, meet the baby animal inside, and start a voice conversation full of short facts and playful questions.',
    accent:
      'from-amber-200 via-orange-200 to-rose-200',
  },
  {
    href: '/jungle',
    icon: '🌿',
    eyebrow: 'Tap the scene',
    title: 'Talking Jungle',
    description:
      'Explore a layered jungle picture book where trees, insects, birds, and animals speak when you discover them.',
    accent:
      'from-emerald-200 via-lime-200 to-cyan-200',
  },
  {
    href: '/globe',
    icon: '🌍',
    eyebrow: 'Spin and discover',
    title: 'Explore the World',
    description:
      'Turn a real 3D globe, choose a country, and speak with a friendly guide who shares child-sized stories about that place.',
    accent: 'from-sky-200 via-cyan-200 to-teal-200',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,244,210,0.98),_rgba(220,249,255,0.94)_44%,_rgba(172,225,194,0.96)_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-amber-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Storybook voice adventures
          </div>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 md:text-7xl">
            Tap into a talking world.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700 md:text-xl">
            This demo turns discovery into conversation. There is no chat box and no
            generic assistant here. Children explore by touching lively scenes and
            speaking with characters who know their own little world.
          </p>
        </div>

        <div className="mt-12 grid flex-1 gap-6 lg:grid-cols-3">
          {adventures.map((adventure) => (
            <Link
              key={adventure.href}
              href={adventure.href}
              className="group relative overflow-hidden rounded-[40px] border border-white/60 bg-white/68 p-8 shadow-[0_30px_90px_rgba(48,66,78,0.18)] backdrop-blur transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/75"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${adventure.accent} opacity-75 transition group-hover:opacity-90`}
              />
              <div className="absolute -right-10 top-8 h-40 w-40 rounded-full bg-white/35 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="text-6xl">{adventure.icon}</p>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-slate-700/75">
                    {adventure.eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
                    {adventure.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
                    {adventure.description}
                  </p>
                </div>
                <div className="mt-10 inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-slate-800">
                  Open adventure
                  <Trees className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
