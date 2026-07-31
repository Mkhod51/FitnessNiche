import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { isOnline, useOnline } from './connectivity';

describe('isOnline', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('reads navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(isOnline()).toBe(false);
  });

  it('defaults to online where navigator is absent', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    expect(isOnline()).toBe(true);
  });
});

describe('useOnline', () => {
  it('flips on the browser online/offline events', () => {
    const { result } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
  });
});
