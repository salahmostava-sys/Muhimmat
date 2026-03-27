import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger monitoring smoke', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('logs error in development mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { logger } = await import('./logger');

    logger.error('test error', new Error('boom'));

    expect(logSpy).toHaveBeenCalled();
    expect(String(logSpy.mock.calls[0]?.[0] ?? '')).toContain('[ERROR] test error');
  });

  it('installs global handlers once', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { installGlobalErrorMonitoring } = await import('./logger');

    installGlobalErrorMonitoring();
    installGlobalErrorMonitoring();

    const rejectionEvent = new Event('unhandledrejection');
    Object.defineProperty(rejectionEvent, 'reason', { value: new Error('rejected once') });
    globalThis.dispatchEvent(rejectionEvent);

    const relevantCalls = logSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes('[ERROR] [global] unhandled rejection')
    );
    expect(relevantCalls).toHaveLength(1);
  });
});

