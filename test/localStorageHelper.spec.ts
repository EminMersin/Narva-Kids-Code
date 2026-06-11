import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageHelper } from '../src/storage/localStorageHelper/localStorageHelper';

describe('LocalStorageHelper', () => {
  const testKey = 'testKey';
  const testData = { foo: 'bar', count: 42 };

  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
    LocalStorageHelper.clear();
  });

  it('set ve get çalışmalı', () => {
    LocalStorageHelper.set(testKey, testData);
    const result = LocalStorageHelper.get<typeof testData>(testKey);
    expect(result).toEqual(testData);
  });

  it('get mevcut olmayan anahtar için null döndürür', () => {
    const result = LocalStorageHelper.get<any>('missingKey');
    expect(result).toBeNull();
  });

  it('remove anahtarı siler', () => {
    LocalStorageHelper.set(testKey, testData);
    LocalStorageHelper.remove(testKey);
    const result = LocalStorageHelper.get<any>(testKey);
    expect(result).toBeNull();
  });

  it('clear tüm verileri temizler', () => {
    LocalStorageHelper.set('a', 1);
    LocalStorageHelper.set('b', 2);
    LocalStorageHelper.clear();
    expect(LocalStorageHelper.get('a')).toBeNull();
    expect(LocalStorageHelper.get('b')).toBeNull();
  });
});
