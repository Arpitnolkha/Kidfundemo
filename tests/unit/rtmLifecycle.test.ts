import { createElement, StrictMode, type ReactNode } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eggCharacters } from '@/lib/characters/eggs';

const sdk = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('agora-rtm', () => ({ default: { RTM: function () { return sdk.create(); } } }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('next/dynamic', () => ({ default: () => ({ children }: { children?: ReactNode }) => children ?? null }));
vi.mock('next/image', () => ({ default: () => null }));

let Experience: typeof import('@/components/characters/CharacterConversationExperience').CharacterConversationExperience;
const props = {
  character: eggCharacters[0], scene: 'eggs' as const, transcript: '',
  onTranscriptChange: vi.fn(), status: 'idle' as const, onStatusChange: vi.fn(),
  soundEnabled: true, onToggleSound: vi.fn(), onRequestMic: async () => true,
  devPanel: false, discoveries: 1, onClose: vi.fn(),
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const token = { uid: '123', token: 'test-token', channel: 'test-channel' };
const response = (body: unknown) => ({ ok: true, json: async () => body });
let client: { login: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_DEMO_MODE', 'false');
  vi.stubEnv('NEXT_PUBLIC_AGORA_APP_ID', 'test-app');
  Experience = (await import('@/components/characters/CharacterConversationExperience')).CharacterConversationExperience;
});
beforeEach(() => {
  client = { login: vi.fn().mockResolvedValue({}), subscribe: vi.fn().mockResolvedValue({}), logout: vi.fn().mockResolvedValue({}) };
  sdk.create.mockReset().mockReturnValue(client);
  fetchMock = vi.fn(async (url: string) => response(url.includes('/token') ? token : { agentId: 'agent-1' }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('storybook RTM lifecycle', () => {
  it('does not create an RTM client for the cancelled StrictMode startup', async () => {
    const view = render(createElement(StrictMode, null, createElement(Experience, props)));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url === '/api/agora/agent/start')).toBe(true));
    expect(sdk.create).toHaveBeenCalledTimes(1);
    expect(client.login).toHaveBeenCalledWith({ token: token.token });
    expect(client.subscribe).toHaveBeenCalledWith(token.channel);
    view.unmount();
    await waitFor(() => expect(client.logout).toHaveBeenCalledTimes(1));
  });

  it('logs out after a pending login settles when the popup was closed', async () => {
    const login = deferred<object>();
    client.login.mockReturnValue(login.promise);
    const view = render(createElement(Experience, props));
    await waitFor(() => expect(client.login).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => { login.resolve({}); });
    expect(client.logout).toHaveBeenCalledTimes(1);
    expect(client.subscribe).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/agora/agent/start')).toBe(false);
  });

  it('cleans up a client when subscription fails', async () => {
    client.subscribe.mockRejectedValue(new Error('subscription failed'));
    render(createElement(Experience, props));
    await waitFor(() => expect(client.logout).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/agora/agent/start')).toBe(false);
  });

  it('cleans up RTM if the agent request fails', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/agora/agent/start') throw new Error('network failure');
      return response(token);
    });
    render(createElement(Experience, props));
    await waitFor(() => expect(client.logout).toHaveBeenCalledTimes(1));
  });

  it('stops an agent that finishes starting after the popup closes', async () => {
    const start = deferred<ReturnType<typeof response>>();
    fetchMock.mockImplementation(async (url: string) => url === '/api/agora/agent/start' ? start.promise : response(token));
    const view = render(createElement(Experience, props));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url === '/api/agora/agent/start')).toBe(true));
    view.unmount();
    await act(async () => { start.resolve(response({ agentId: 'late-agent' })); });
    expect(client.logout).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/agora/agent/stop', expect.objectContaining({ body: JSON.stringify({ agentId: 'late-agent' }) }));
  });

  it('does not clear a replacement session when stale startup finishes', async () => {
    const firstStart = deferred<ReturnType<typeof response>>();
    const second = { login: vi.fn().mockResolvedValue({}), subscribe: vi.fn().mockResolvedValue({}), logout: vi.fn().mockResolvedValue({}) };
    sdk.create.mockReturnValueOnce(client).mockReturnValueOnce(second);
    let starts = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/agora/agent/start') {
        return ++starts === 1 ? firstStart.promise : response({ agentId: 'new-agent' });
      }
      return response(token);
    });
    const view = render(createElement(Experience, props));
    await waitFor(() => expect(starts).toBe(1));
    view.rerender(createElement(Experience, { ...props, discoveries: 2 }));
    await waitFor(() => expect(starts).toBe(2));
    await act(async () => { firstStart.resolve(response({ agentId: 'old-agent' })); });
    expect(client.logout).toHaveBeenCalledTimes(1);
    expect(second.logout).not.toHaveBeenCalled();
    view.unmount();
    await waitFor(() => expect(second.logout).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/agora/agent/stop', expect.objectContaining({ body: JSON.stringify({ agentId: 'new-agent' }) }));
  });

});
