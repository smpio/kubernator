import { delay } from 'redux-saga';
import { all, call, put, select, take, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  toKeysObject,
  toKeysArray,
} from '../../utils';

import {
  PREFIX,
  ID,
  URL,
  GROUP,
  RESOURCE,
  RESOURCES,
  ITEMS,
  READONLY,
  LISTABLE,
  LOADING_TREE,
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

export const NAMESPACE_ITEMS_GET = `${PREFIX}/NAMESPACE_ITEMS_GET`;
export const NAMESPACE_ITEMS_GET__S = `${PREFIX}/NAMESPACE_ITEMS_GET/S`;
export const NAMESPACE_ITEMS_GET__F = `${PREFIX}/NAMESPACE_ITEMS_GET/F`;

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

export const namespaceItemsGet = (namespace, resolve, reject) => ({
  type: NAMESPACE_ITEMS_GET,
  payload: { namespace, resolve, reject },
});

export const resourceItemsGet = (resource, namespace, resolve, reject) => ({
  type: RESOURCE_ITEMS_GET,
  payload: { resource, namespace, resolve, reject },
});


// api
// ------

async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}


// state
// ---------

function stateResourcesGet(state) {
  return state[PREFIX].resources;
}

export const treeState = {
  flags: {},
  groups: {},
  resources: {},
  models: {},
  items: {},
};


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
      yield delay(0);

      // get root[GROUPS]
      yield put(rootGroupsGet());
      const { payload: { groups }} = yield take(ROOT_GROUPS_GET__S);

      // progress
      yield put({
        type: TREE_GET__PROGRESS,
        payload: { stage: 'resources' },
      });
      yield delay(0);

      // ∀ group => get group[RESOURCES]
      yield all(groups.map(group => put(groupResourcesGet(group))));
      const groupResourcesGot = yield all(groups.map(() => take(GROUP_RESOURCES_GET__S)));
      let resources = Array.prototype.concat.apply([], groupResourcesGot.map(action => action.payload.resources));

      // progress
      yield put({
        type: TREE_GET__PROGRESS,
        payload: { stage: 'namespaces' },
      });
      yield delay(0);

      // get namespaces
      const namespaces = resources.find(resource => resource.name === 'namespaces');
      yield put(resourceItemsGet(namespaces));
      yield take(RESOURCE_ITEMS_GET__S);

      // success
      yield put({ type: TREE_GET__S });

      // resolve
      if (resolve) yield call(resolve);
    }

    catch (error) {

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
        preferredVersion: {
          groupVersion: '/api/v1',
          version: 'v1',
        },
        [URL]: '/api/v1',
      });

      //
      yield put({
        type: ROOT_GROUPS_GET__S,
        payload: { groups },
      });

      // resolve promise
      if (resolve) yield call(resolve);
    }

    catch (error) {

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
      let { models } = yield call(apiGet, `/swaggerapi/${group[URL]}`);

      // process models
      const { version } = group.preferredVersion;
      models = Object.keys(models)
        .filter(key => key.startsWith(version))
        .map(key => {
          const [, kind] = key.split('.');
          const model = models[key];

          // set id
          delete model.id;
          model[ID] = kind;

          // rename refs
          const { properties } = model;
          Object.keys(properties).forEach(id => {
            const property = properties[id];
            const { $ref, description } = property;

            // rename ref
            if ($ref) property.$ref = $ref.split('.')[1];

            // set readonly flag
            property[READONLY] = description && description.includes('Read-only.');
          });

          //
          return model;
        });

      //
      yield put({
        type: GROUP_RESOURCES_GET__S,
        payload: { resources, models },
        meta: { group },
      });

      // resolve promise
      if (resolve) yield call(resolve);
    }

    catch (error) {

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

function* sagaNamespaceItemsGet() {
  yield takeEvery(NAMESPACE_ITEMS_GET, function* (action) {
    const { namespace, resolve, reject } = action.payload;
    try {

      // get all resources
      const resources = yield select(stateResourcesGet);

      // filter correctly namespaced resources
      const namespaced = !!namespace;
      const targetResources = Object.keys(resources).filter(id => {
        const resource = resources[id];
        return resource[LISTABLE] && resource.namespaced === namespaced;
      });

      // ∀ resource => request resource[ITEMS]
      for (let id of targetResources) {
        yield put(resourceItemsGet(resources[id], namespace));
        yield take(RESOURCE_ITEMS_GET__S);
        yield delay(0);
      }

      //
      yield put({ type: NAMESPACE_ITEMS_GET__S });

      // resolve promise
      if (resolve) yield call(resolve);
    }

    catch (error) {

      //
      yield put({
        type: NAMESPACE_ITEMS_GET__F,
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
    const { resource, namespace, resolve, reject } = action.payload;
    try {

      // get items
      const resourceUrl = resourceGetUrl(resource, namespace);
      const { items } = yield call(apiGet, resourceUrl);

      //
      yield put({
        type: RESOURCE_ITEMS_GET__S,
        payload: { items },
        meta: { resource, namespace },
      });

      // resolve promise
      if (resolve) yield call(resolve);
    }

    catch (error) {

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
    sagaNamespaceItemsGet(),
    sagaResourceItemsGet(),
  ]);
}


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
    const { name, verbs } = resource;

    resource[GROUP] = groupId;
    resource[ID] = name;
    resource[URL] = `${groupUrl}/${name}`;
    resource[ITEMS] = [];
    resource[LISTABLE] = verbs.includes('list');

    // crunches for correct item urls
    resource[URL_PART_GROUP] = groupUrl;
    resource[URL_PART_RESOURCE] = `${name}`;
  };
}

export function decorateItem(resource) {
  const { [ID]: resourceId } = resource;
  return item => {
    const { uid, name, namespace } = item.metadata;
    const resourceUrl = resourceGetUrl(resource, namespace);
    item[RESOURCE] = resourceId;
    item[ID] = uid || `[nouid]-${name}`;
    item[URL] = `${resourceUrl}/${name}`;
  };
}

export const treeReducer = {

  [TREE_GET__PROGRESS]: (state, action) => {
    const { stage } = action.payload;
    return update(state, {
      flags: {
        [LOADING_TREE]: { $set: stage },
      },
    });
  },

  [TREE_GET__S]: (state, action) => {
    return update(state, {
      flags: {
        [LOADING_TREE]: { $set: null },
      },
    });
  },

  [ROOT_GROUPS_GET__S]: (state, action) => {
    const { groups } = action.payload;

    const decorate = decorateGroup();
    groups.forEach(group => decorate(group));

    return update(state, {
      groups: { $set: toKeysObject(groups, ID) },
    });
  },

  [GROUP_RESOURCES_GET__S]: (state, action) => {
    const { resources, models } = action.payload;
    const { group } = action.meta;

    const decorate = decorateResource(group);
    resources.forEach(resource => decorate(resource));

    return update(state, {
      groups: {
        [group[ID]]: {
          [RESOURCES]: { $set: toKeysArray(resources, ID) },
        },
      },
      resources: { $merge: toKeysObject(resources, ID) },
      models: { $merge: toKeysObject(models, ID) },
    });
  },

  [RESOURCE_ITEMS_GET__S]: (state, action) => {
    const { items } = action.payload;
    const { resource, namespace } = action.meta;

    // decorate items
    const decorate = decorateItem(resource);
    items.forEach(item => decorate(item));

    // merge items
    const idsNew = toKeysArray(items, ID);
    const idsMerge = idsOld => {
      const { items } = state;
      return idsOld
        .filter(id => items[id].metadata.namespace !== namespace)
        .concat(idsNew);
    };

    //
    return update(state, {
      resources: {
        [resource[ID]]: {
          [ITEMS]: { $apply: idsMerge },
        },
      },
      items: { $merge: toKeysObject(items, ID) },
    });
  },
};


// helpers
// ---------

export const resourceGetUrl = (resource, namespace) => namespace
  ? `${resource[URL_PART_GROUP]}/namespaces/${namespace}/${resource[URL_PART_RESOURCE]}`
  : resource[URL];
