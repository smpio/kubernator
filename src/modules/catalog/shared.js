export const PREFIX = 'catalog';

export const ID = Symbol('ID');
export const URL = Symbol('URL');
export const YAML = Symbol('YAML');

export const GROUPS = Symbol('GROUPS');
export const GROUP = Symbol('GROUP');
export const RESOURCE = Symbol('RESOURCE');
export const RESOURCES = Symbol('RESOURCES');
export const ITEMS = Symbol('ITEMS');

export const LOADING = Symbol('LOADING');

export function toIdsObject(arr) {
  if (!arr) return {};
  if (!Array.isArray(arr)) arr = [arr];
  return arr.reduce((obj, item) => (obj[item[ID]] = item) && obj, {});
}

export function toIdsArray(arr) {
  if (!arr) return [];
  if (!Array.isArray(arr)) arr = [arr];
  return arr.map(item => item[ID]);
}
