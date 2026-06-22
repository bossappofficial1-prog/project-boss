import AsyncStorage from "@react-native-async-storage/async-storage";

export function debouncedAsyncStorage(ms = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let pending: { key: string; value: string } | null = null;

  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => {
      pending = { key, value };
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (pending) {
          AsyncStorage.setItem(pending.key, pending.value);
          pending = null;
        }
      }, ms);
    },
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };
}
