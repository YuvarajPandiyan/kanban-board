export const setLocalStorage = (key: string, data: object) =>
  localStorage.setItem(key, JSON.stringify(data));

export const getLocalStorageDateByKey = (key: string) =>
  JSON.parse(localStorage.getItem(key) || "{}");
