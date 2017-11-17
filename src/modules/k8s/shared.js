import { call, put, take, takeEvery } from 'redux-saga/effects';
import store from 'store';

import {
  NotiErrorApi,
} from '../../middleware/notifications';

// constants
// -----------

export const PREFIX = 'k8s';

export const LOADING = Symbol('LOADING');
export const FAILURE = Symbol('FAILURE');

export const ID = Symbol('ID');
export const URL = Symbol('URL');
export const YAML = Symbol('YAML');

export const GROUP_ID = Symbol('GROUP_ID');
export const RESOURCE_ID = Symbol('RESOURCE_ID');

export const RESOURCE_IDS = Symbol('RESOURCE_IDS');
export const ITEM_IDS = Symbol('ITEM_IDS');

export const IS_READONLY = Symbol('IS_READONLY');
export const IS_LISTABLE = Symbol('IS_LISTABLE');

export const CATALOG_LOADING_STAGE = Symbol('CATALOG_LOADING_STAGE');
export const CATALOG_LOADING_STAGE_GROUPS = Symbol('CATALOG_LOADING_STAGE_GROUPS');
export const CATALOG_LOADING_STAGE_RESOURCES = Symbol('CATALOG_LOADING_STAGE_RESOURCES');
export const CATALOG_LOADING_STAGE_NAMESPACES = Symbol('CATALOG_LOADING_STAGE_NAMESPACES');

export const URL_PART_GROUP = Symbol('URL_PART_GROUP');
export const URL_PART_RESOURCE = Symbol('URL_PART_RESOURCE');

export const NO_GROUP = '[nogroup]';
export const NO_NAMESPACE = '[nonamespace]';
export const NO_UID = '[nouid]';

export const UI_THROTTLE = 100;


// network
// ---------

export const apiFlagsUnset = {
  [LOADING]: false,
  [FAILURE]: false,
};

export function apiFlagsSet(state, action) {
  const { payload: { error } = {}} = action;
  return {
    [LOADING]: !error,
    [FAILURE]: !!error,
  };
}

export async function apiFetch(url, options = {}, parser = 'json') {
  const netResponse = await fetch(url, options);
  if (netResponse.ok) return netResponse[parser]();
  else {
    let apiResponse;

    // parse as text
    try {
      apiResponse = await netResponse.text();
    }
    catch (e) {}

    // parse as json
    try {
      apiResponse = JSON.parse(apiResponse);
    }
    catch (e) {}

    // notify
    throw new NotiErrorApi(apiResponse, netResponse);
  }
}

export async function cacheGet(url) {
  let result = store.get(url);
  if (!result) {
    result = await apiFetch(url);
    store.set(url, result);
  }
  return Promise.resolve(result);
}


// actions
// ---------

export function* putTake(actionPut, actionsTake) {
  const $id = Date.now();

  // put
  if (!actionPut.meta) actionPut.meta = {};
  actionPut.meta.$id = $id;
  yield put(actionPut);

  // take
  const [actionTypeS/*, actionTypeF*/] = actionsTake;
  let action = { meta: { $id: null }};
  while (action.meta.$id !== $id) {
    action = yield take(actionsTake);
  }

  //
  return action.type === actionTypeS ? action : null;
}

export function* takeEveryReq(actions, fn, _onSuccess) {
  const [REQUEST, SUCCESS, FAILURE] = actions;
  yield takeEvery(REQUEST, function* (action) {
    const { payload, meta, promise: { _resolve, _reject } = {}} = action;
    try {
      const payload = yield call(fn, action);
      if (payload) {
        yield put({
          type: SUCCESS,
          payload,
          meta,
        });
        if (_onSuccess) yield call(_onSuccess, payload);
        if (_resolve) _resolve(payload);
      }
    }
    catch (error) {
      if (_reject) _reject(error);
      yield put({
        type: FAILURE,
        payload: { ...payload, error },
        meta,
      });
    }
  });
}
