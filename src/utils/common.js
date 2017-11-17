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

export function selectArrOptional(arr) {

  return arr.length ? arr : null;
}

export function selectArr(obj = {}) {

  return selectArrOptional(Object.keys(obj).map(key => obj[key]));
}
