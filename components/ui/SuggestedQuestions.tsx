'use client';

export function SuggestedQuestions({
  questions,
  onAsk,
}: {
  questions: string[];
  onAsk: (question: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5 sm:gap-3">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onAsk(question)}
          className="min-h-11 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-left text-sm font-semibold leading-5 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
