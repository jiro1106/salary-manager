export const storage = {
  get<T>(key: string): T | null {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  /**
   * Reports whether the write landed. A read can fail quietly — the caller
   * falls back to defaults and the reader sees a fresh app, which is a
   * coherent thing to see. A *write* failing quietly is the one that loses
   * work: every edit still applies to the screen, so the app looks saved
   * right up until the tab is closed and the split is gone. Storage that is
   * disabled or full is the only real failure mode this app has, and the
   * caller has to be able to say so.
   */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};
