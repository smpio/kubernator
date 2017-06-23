import { delay } from 'redux-saga';
import { all, call, put, take, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  ID,
  URL,
  GROUP,
  RESOURCE,
  RESOURCES,
  ITEMS,
  LOADING,
  toIdsObject,
  toIdsArray,
  URL_PART_GROUP,
  URL_PART_RESOURCE,
} from './shared';


// action codes
// --------------

export const TREE_GET = `${PREFIX}/TREE_GET`;
export const TREE_GET__PROGRESS = `${PREFIX}/TREE_GET/PROGRESS`;
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

      // progress
      yield put({
        type: TREE_GET__PROGRESS,
        payload: { stage: 'groups' },
      });

      // sleep
      yield delay(500);

      // get root[GROUPS]
      yield put(rootGroupsGet());
      const { payload: { groups }} = yield take(ROOT_GROUPS_GET__S);

      // progress
      yield put({
        type: TREE_GET__PROGRESS,
        payload: { stage: 'resources' },
      });

      // sleep
      yield delay(500);

      // ∀ group => get group[RESOURCES]
      yield all(groups.map(group => put(groupResourcesGet(group))));
      const groupResourcesGot = yield all(groups.map(() => take(GROUP_RESOURCES_GET__S)));

      // resources => merge, flatten and filter
      let resources = Array.prototype
        .concat.apply([], groupResourcesGot.map(action => action.payload.resources))
        .filter(resource => resource.verbs.includes('list'));

      // progress
      yield put({
        type: TREE_GET__PROGRESS,
        payload: { stage: 'items' },
      });

      // sleep
      yield delay(500);

      // ∀ resource => get resource[ITEMS]
      yield all(resources.map(resource => put(resourceItemsGet(resource))));
      yield all(resources.map(() => take(RESOURCE_ITEMS_GET__S)));

      // success
      yield put({ type: TREE_GET__S });

      // resolve
      if (resolve) yield call(resolve);

    } catch (error) {

      // error
      yield put({
        type: TREE_GET__F,
        payload: error,
        error: true,
      });

      // reject
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
  groups: {},
  resources: {},
  items: {},
};


// reducer
// ---------

export function decorateGroup() {
  return group => {
    group[ID] = group.name;
    group[URL] = group[URL] || `/apis/${group.preferredVersion.groupVersion}`;
    group[RESOURCES] = [];
  };
}

export function decorateResource(group) {
  const {
    [ID]: groupId,
    [URL]: groupUrl,
  } = group;
  return resource => {
    const { name } = resource;

    resource[GROUP] = groupId;
    resource[ID] = name;
    resource[URL] = `${groupUrl}/${name}`;
    resource[ITEMS] = [];

    // crunches for correct item urls
    resource[URL_PART_GROUP] = groupUrl;
    resource[URL_PART_RESOURCE] = `${name}`;
  };
}

export function decorateItem(resource) {
  const {
    namespaced: resourceNamespaced,
    [ID]: resourceId,
    [URL_PART_GROUP]: resourceUrlPartGroup,
    [URL_PART_RESOURCE]: resourceUrlPartResource,
  } = resource;
  return item => {
    const { uid, name, namespace } = item.metadata;
    item[RESOURCE] = resourceId;
    item[ID] = uid || `[nouid]-${name}`;
    item[URL] = resourceNamespaced
      ? `${resourceUrlPartGroup}/namespaces/${namespace}/${resourceUrlPartResource}/${name}`
      : `${resourceUrlPartGroup}/${resourceUrlPartResource}/${name}`;
  };
}

export const treeReducer = {

  [TREE_GET__PROGRESS]: (state, action) => {
    const { stage } = action.payload;
    return update(state, {
      [LOADING]: { $set: stage },
    });
  },

  [TREE_GET__S]: (state, action) => {
    return update(state, {
      [LOADING]: { $set: null },
    });
  },

  [ROOT_GROUPS_GET__S]: (state, action) => {
    const { groups } = action.payload;
    
    const decorate = decorateGroup();
    groups.forEach(group => decorate(group));
    
    return update(state, {
      groups: { $set: toIdsObject(groups) },
    });
  },

  [GROUP_RESOURCES_GET__S]: (state, action) => {
    const { resources } = action.payload;
    const { group } = action.meta;

    const decorate = decorateResource(group);
    resources.forEach(resource => decorate(resource));
    
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
    const { items } = action.payload;
    const { resource } = action.meta;

    const decorate = decorateItem(resource);
    items.forEach(item => decorate(item));

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
