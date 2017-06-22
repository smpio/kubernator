import { all, call, put, take, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  ID,
  URL,
  GROUPS,
  GROUP,
  RESOURCE,
  RESOURCES,
  ITEMS,
  LOADING,
  toIdsObject,
  toIdsArray,
} from './shared';


// action codes
// --------------

export const TREE_GET = `${PREFIX}/TREE_GET`;
export const TREE_GET__S = `${PREFIX}/TREE_GET/S`;
export const TREE_GET__F = `${PREFIX}/TREE_GET/F`;

export const ROOT_GROUPS_GET = `${PREFIX}/ROOT_GROUPS_GET`;
export const ROOT_GROUPS_GET__S = `${PREFIX}/ROOT_GROUPS_GET/S`;
export const ROOT_GROUPS_GET__F = `${PREFIX}/ROOT_GROUPS_GET/F`;

export const GROUP_RESOURCES_GET = `${PREFIX}/GROUP_RESOURCES_GET`;
export const GROUP_RESOURCES_GET__S = `${PREFIX}/GROUP_RESOURCES_GET/S`;
export const GROUP_RESOURCES_GET__F = `${PREFIX}/GROUP_RESOURCES_GET/F`;

export const RESOURCE_ITEMS_GET = `${PREFIX}/RESOURCE_ITEMS_GET`;
export const RESOURCE_ITEMS_GET__S = `${PREFIX}/RESOURCE_ITEMS_GET/S`;
export const RESOURCE_ITEMS_GET__F = `${PREFIX}/RESOURCE_ITEMS_GET/F`;


// action creators
// -----------------

export const treeGet = (resolve, reject) => ({
  type: TREE_GET,
  payload: { resolve, reject },
});

export const rootGroupsGet = (resolve, reject) => ({
  type: ROOT_GROUPS_GET,
  payload: { resolve, reject },
});

export const groupResourcesGet = (group, resolve, reject) => ({
  type: GROUP_RESOURCES_GET,
  payload: { group, resolve, reject },
});

export const resourceItemsGet = (resource, resolve, reject) => ({
  type: RESOURCE_ITEMS_GET,
  payload: { resource, resolve, reject },
});


// api
// ------

async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}


// saga
// ------

function* sagaTreeGet() {
  yield takeEvery(TREE_GET, function* (action) {
    const { resolve, reject } = action.payload;
    try {

      // get groups
      yield put(rootGroupsGet());
      const { payload: { groups }} = yield take(ROOT_GROUPS_GET__S);

      // for every group
      for (let group of groups) {

        // get resources
        yield put(groupResourcesGet(group));
        const { payload: { resources }} = yield take(GROUP_RESOURCES_GET__S);

        // for every listable resource
        for (let resource of resources) {
          if (resource.verbs.includes('list')) {

            // get items
            yield put(resourceItemsGet(resource));
          }
        }
      }

      //
      yield put({ type: TREE_GET__S });

      // resolve promise
      if (resolve) yield call(resolve);

    } catch (error) {

      //
      yield put({
        type: TREE_GET__F,
        payload: error,
        error: true,
      });

      // reject promise
      if (reject) yield call(reject);
    }
  });
}

function* sagaRootGroupsGet() {
  yield takeEvery(ROOT_GROUPS_GET, function* (action) {
    const { resolve, reject } = action.payload;
    try {
      const { groups } = yield call(apiGet, '/apis');

      // add general api
      // as a fake group
      groups.push({
        name: '[nogroup]',
        [URL]: '/api/v1',
      });

      //
      yield put({
        type: ROOT_GROUPS_GET__S,
        payload: { groups },
      });

      // resolve promise
      if (resolve) yield call(resolve);

    } catch (error) {

      //
      yield put({
        type: ROOT_GROUPS_GET__F,
        payload: error,
        error: true,
      });

      // reject promise
      if (reject) yield call(reject);
    }
  });
}

function* sagaGroupResourcesGet() {
  yield takeEvery(GROUP_RESOURCES_GET, function* (action) {
    const { group, resolve, reject } = action.payload;
    try {
      const { resources } = yield call(apiGet, group[URL]);

      //
      yield put({
        type: GROUP_RESOURCES_GET__S,
        payload: { resources },
        meta: { group },
      });

      // resolve promise
      if (resolve) yield call(resolve);

    } catch (error) {

      //
      yield put({
        type: GROUP_RESOURCES_GET__F,
        payload: error,
        error: true,
      });

      // reject promise
      if (reject) yield call(reject);
    }
  });
}

function* sagaResourceItemsGet() {
  yield takeEvery(RESOURCE_ITEMS_GET, function* (action) {
    const { resource, resolve, reject } = action.payload;
    try {
      const { items } = yield call(apiGet, resource[URL]);

      //
      yield put({
        type: RESOURCE_ITEMS_GET__S,
        payload: { items },
        meta: { resource },
      });

      // resolve promise
      if (resolve) yield call(resolve);

    } catch (error) {

      //
      yield put({
        type: RESOURCE_ITEMS_GET__F,
        payload: error,
        error: true,
      });

      // reject promise
      if (reject) yield call(reject);
    }
  });
}

export function* treeSaga() {
  yield all([
    sagaTreeGet(),
    sagaRootGroupsGet(),
    sagaGroupResourcesGet(),
    sagaResourceItemsGet(),
  ]);
}


// state
// ---------

export const treeState = {
  root: {},
  groups: {},
  resources: {},
  items: {},
};


// reducer
// ---------

export const treeReducer = {

  [TREE_GET]: (state, action) => {
    return update(state, {
      root: {
        [LOADING]: { $set: true },
      },
    });
  },

  [TREE_GET__S]: (state, action) => {
    return update(state, {
      root: {
        [LOADING]: { $set: false },
      },
    });
  },

  [ROOT_GROUPS_GET__S]: (state, action) => {
    const { groups } = action.payload;

    groups.forEach(group => {
      group[ID] = group.name;
      group[URL] = group[URL] || `/apis/${group.preferredVersion.groupVersion}`;
      group[RESOURCES] = [];
    });

    return update(state, {
      root: {
        [GROUPS]: { $set: toIdsArray(groups).sort() },
      },
      groups: { $set: toIdsObject(groups) },
    });
  },

  [GROUP_RESOURCES_GET__S]: (state, action) => {
    const { group } = action.meta;
    const { resources } = action.payload;

    resources.forEach(resource => {
      resource[GROUP] = group[ID];
      resource[ID] = resource.name;
      resource[URL] = `${group[URL]}/${resource.name}`;
      resource[ITEMS] = [];
    });

    return update(state, {
      groups: {
        [group[ID]]: {
          [RESOURCES]: { $set: toIdsArray(resources).sort() },
        },
      },
      resources: { $merge: toIdsObject(resources) },
    });
  },

  [RESOURCE_ITEMS_GET__S]: (state, action) => {
    const { resource } = action.meta;
    const { items } = action.payload;

    items.forEach(item => {
      const { uid, name } = item.metadata;
      item[RESOURCE] = resource[ID];
      item[ID] = uid || `[nouid]-${name}`;
      item[URL] = `/${name}`;
    });

    return update(state, {
      resources: {
        [resource[ID]]: {
          [ITEMS]: { $set: toIdsArray(items).sort() },
        },
      },
      items: { $merge: toIdsObject(items) },
    });
  },
};
