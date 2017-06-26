export function toKeysObject(arr, key) {
  if (!arr) return {};
  if (!Array.isArray(arr)) arr = [arr];
  return arr.reduce((obj, item) => (obj[item[key]] = item) && obj, {});
}

export function toKeysArray(arr, key) {
  if (!arr) return [];
  if (!Array.isArray(arr)) arr = [arr];
  return arr.map(item => item[key]);
}
