'use client';

import type { AgentState } from 'agora-agent-client-toolkit';
import type { QuickstartAgentMetric } from './QuickstartPipelineMetrics';
import type { TranscriptStreamEvent } from '@/lib/agora/transcriptStream';

type LatencyDebugPanelProps = {
  events: TranscriptStreamEvent[];
  metrics: QuickstartAgentMetric[];
  agentState: AgentState | null;
  timings: LatencyTimings;
};

export type LatencyTimings = {
  speechStartedAt?: number;
  speechEndedAt?: number;
  firstAsrPartialAt?: number;
  finalAsrAt?: number;
  firstAgentTextAt?: number;
  agentTextCompletedAt?: number;
  audioPlaybackStartedAt?: number;
};

function formatMs(value?: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${Math.max(0, Math.round(value))} ms`
    : 'not reported';
}

function findMetric(metrics: QuickstartAgentMetric[], type: RegExp, name: RegExp) {
  return [...metrics]
    .reverse()
    .find((metric) => type.test(metric.type) && name.test(metric.name))?.value;
}

export function LatencyDebugPanel({
  events,
  metrics,
  agentState,
  timings,
}: LatencyDebugPanelProps) {
  const userEvents = events.filter((event) => event.speaker === 'user');
  const agentEvents = events.filter((event) => event.speaker === 'agent');

  const llmTtft = findMetric(metrics, /llm|mllm/i, /ttft|first.*token/i);
  const llmTotal = findMetric(metrics, /llm|mllm/i, /total|duration|latency/i);
  const ttsTtfb = findMetric(metrics, /tts/i, /ttfb|first.*(byte|audio)/i);
  const asrPartial =
    timings.speechStartedAt && timings.firstAsrPartialAt
      ? timings.firstAsrPartialAt - timings.speechStartedAt
      : undefined;
  const asrFinal =
    timings.speechEndedAt && timings.finalAsrAt
      ? timings.finalAsrAt - timings.speechEndedAt
      : undefined;
  const observedLlmTtft =
    timings.speechEndedAt && timings.firstAgentTextAt
      ? timings.firstAgentTextAt - timings.speechEndedAt
      : undefined;
  const observedLlmTotal =
    timings.speechEndedAt && timings.agentTextCompletedAt
      ? timings.agentTextCompletedAt - timings.speechEndedAt
      : undefined;
  const observedTtsTtfb =
    timings.firstAgentTextAt && timings.audioPlaybackStartedAt
      ? timings.audioPlaybackStartedAt - timings.firstAgentTextAt
      : undefined;
  const total =
    timings.speechEndedAt && timings.audioPlaybackStartedAt
      ? timings.audioPlaybackStartedAt - timings.speechEndedAt
      : undefined;

  return (
    <details className="mt-2 rounded-2xl bg-slate-950/90 px-4 py-3 text-xs text-slate-100">
      <summary className="cursor-pointer font-bold text-cyan-200">
        Latency diagnostics
      </summary>
      <dl className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5">
        <dt>Transcript transport</dt><dd>RTC stream</dd>
        <dt>User transcript received</dt><dd>{userEvents.length ? 'yes' : 'no'}</dd>
        <dt>Agent transcript received</dt><dd>{agentEvents.length ? 'yes' : 'no'}</dd>
        <dt>ASR partial</dt>
        <dd>{formatMs(asrPartial)}</dd>
        <dt>ASR final</dt>
        <dd>{formatMs(asrFinal)}</dd>
        <dt>LLM TTFT</dt>
        <dd>{formatMs(llmTtft ?? observedLlmTtft)}</dd>
        <dt>LLM total</dt>
        <dd>{formatMs(llmTotal ?? observedLlmTotal)}</dd>
        <dt>TTS TTFB</dt>
        <dd>{formatMs(ttsTtfb ?? observedTtsTtfb)}</dd>
        <dt>Playback delay</dt>
        <dd>not exposed separately</dd>
        <dt>Total speech-end to audio</dt>
        <dd>{formatMs(total)}</dd>
        <dt>Agent state</dt>
        <dd>{agentState ?? 'unknown'}</dd>
      </dl>
      <p className="mt-3 text-[11px] leading-4 text-slate-400">
        Provider metrics are used when Agora reports them. Other values are
        client-observed from agent state and transcript arrival events.
      </p>
      {metrics.length ? (
        <div className="mt-3 border-t border-white/15 pt-2 text-slate-300">
          {metrics.map((metric, index) => (
            <div key={`${metric.timestamp}-${metric.type}-${metric.name}-${index}`}>
              {metric.type}.{metric.name}: {formatMs(metric.value)}
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}
