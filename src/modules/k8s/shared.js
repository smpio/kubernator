import { put, take } from 'redux-saga/effects';

export const PREFIX = 'k8s';

export const ID = Symbol('ID');
export const URL = Symbol('URL');
export const YAML = Symbol('YAML');

export const GROUP_ID = Symbol('GROUP_ID');
export const RESOURCE_ID = Symbol('RESOURCE_ID');

export const RESOURCE_IDS = Symbol('RESOURCE_IDS');
export const ITEM_IDS = Symbol('ITEM_IDS');

export const IS_READONLY = Symbol('IS_READONLY');
export const IS_LISTABLE = Symbol('IS_LISTABLE');
export const IS_LOADING_CATALOG = Symbol('IS_LOADING_CATALOG');

export const URL_PART_GROUP = Symbol('URL_PART_GROUP');
export const URL_PART_RESOURCE = Symbol('URL_PART_RESOURCE');

export const NO_GROUP = '[nogroup]';
export const NO_NAMESPACE = '[nonamespace]';
export const NO_UID = '[nouid]';

export async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}

export function* putTake(actionPut, actionTake) {
  const $id = Date.now();

  // put
  if (!actionPut.meta) actionPut.meta = {};
  actionPut.meta.$id = $id;
  yield put(actionPut);

  // take
  let action = { meta: { $id: null }};
  while (action.meta.$id !== $id) {
    action = yield take(actionTake);
  }

  //
  return action;
}

export function selectArrOptional(arr) {
  return arr.length ? arr : null;
}

export function selectArr(obj = {}) {
  return selectArrOptional(Object.keys(obj).map(key => obj[key]));
}
