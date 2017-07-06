import { delay } from 'redux-saga';
import { all, put, select, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  RESOURCE_IDS,
  IS_LOADING_CATALOG,
  NO_GROUP,
  NO_NAMESPACE,
  putTake,
  selectArr,
} from './shared';

import {
  GROUPS_GET__S,
  GROUPS_GET__F,
  GROUP_GET__S,
  GROUP_GET__F,
  groupsGet,
  groupGet,
  groupsSelectArr,
  groupSelect,
} from './groups';

import {
  RESOURCES_GET__S,
  RESOURCES_GET__F,
  resourcesGet,
  resourcesSelectByGroup,
  resourcesSelectByNamespaced,
  resourceSelect,
} from './resources';

import {
  ITEMS_GET__S,
  ITEMS_GET__F,
  itemsGet,
} from './items';


// action codes
// --------------

export const CATALOG_GET = `${PREFIX}/CATALOG_GET`;
export const CATALOG_GET__ = `${PREFIX}/CATALOG_GET/`;
export const CATALOG_GET__S = `${PREFIX}/CATALOG_GET/S`;
export const CATALOG_GET__F = `${PREFIX}/CATALOG_GET/F`;

export const RBAC_GET = `${PREFIX}/RBAC_GET`;
export const RBAC_GET__S = `${PREFIX}/RBAC_GET/S`;
export const RBAC_GET__F = `${PREFIX}/RBAC_GET/F`;

export const NAMESPACES_GET = `${PREFIX}/NAMESPACES_GET`;
export const NAMESPACES_GET__S = `${PREFIX}/NAMESPACES_GET/S`;
export const NAMESPACES_GET__F = `${PREFIX}/NAMESPACES_GET/F`;

export const NAMESPACE_ITEMS_GET = `${PREFIX}/NAMESPACE_ITEMS_GET`;
export const NAMESPACE_ITEMS_GET__S = `${PREFIX}/NAMESPACE_ITEMS_GET/S`;
export const NAMESPACE_ITEMS_GET__F = `${PREFIX}/NAMESPACE_ITEMS_GET/F`;


// action creators
// -----------------

export const catalogGet = () => ({
  type: CATALOG_GET,
});

export const rbacGet = () => ({
  type: RBAC_GET,
});

export const namespacesGet = () => ({
  type: NAMESPACES_GET,
});

export const namespaceItemsGet = (namespaceName, resolve, reject) => ({
  type: NAMESPACE_ITEMS_GET,
  payload: { namespaceName, resolve, reject },
});


// state
// ---------

function namespacesSelectArr(state) {
  return selectArr(state[PREFIX].namespaces);
}

export const comboState = {
  flags: {},
  namespaces: [],
};


// saga
// ------

function* sagaCatalogGet() {
  yield takeEvery(CATALOG_GET, function* (action) {
    const { meta } = action;
    try {

      //
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'groups' },
      });
      yield delay(0);

      // groups [cache]
      const groups =
        (yield select(groupsSelectArr)) ||
        (yield putTake(groupsGet(), [GROUPS_GET__S, GROUPS_GET__F])).payload.groups;

      //
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'resources' },
      });
      yield delay(0);

      // resources [cache]
      yield all(groups
        .filter(group => !group[RESOURCE_IDS].length)
        .map(group => putTake(resourcesGet(group), [RESOURCES_GET__S, RESOURCES_GET__F]))
      );

      //
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'namespaces' },
      });
      yield delay(0);

      // namespaces [cache]
      (yield select(namespacesSelectArr)) ||
      (yield putTake(namespacesGet(), [NAMESPACES_GET__S, NAMESPACES_GET__F]));

      //
      yield put({
        type: CATALOG_GET__S,
        meta,
      });
    }
    catch (error) {
      yield put({
        error: true,
        type: CATALOG_GET__F,
        payload: error,
        meta,
      });
    }
  });
}

function* sagaRbacGet() {
  yield takeEvery(RBAC_GET, function* (action) {
    const { meta } = action;
    try {

      // group [cache]
      const id = 'rbac.authorization.k8s.io';
      const group =
        (yield select(groupSelect, id)) ||
        (yield putTake(groupGet(id), [GROUP_GET__S, GROUP_GET__F])).payload.group;

      // resources [cache]
      const resources =
        (yield select(resourcesSelectByGroup, group)) ||
        (yield putTake(resourcesGet(group), [RESOURCES_GET__S, RESOURCES_GET__F])).payload.resources;

      // items
      yield all(resources.map(resource =>
        putTake(itemsGet(resource), [ITEMS_GET__S, ITEMS_GET__F])
      ));
      
      //
      yield put({
        type: RBAC_GET__S,
        meta,
      });
    }
    catch (error) {
      yield put({
        error: true,
        type: RBAC_GET__F,
        payload: error,
        meta,
      });
    }
  });
}

function* sagaNamespacesGet() {
  yield takeEvery(NAMESPACES_GET, function* (action) {
    const { meta } = action;
    try {

      // namespaces [cache]
      let namespaces = yield select(namespacesSelectArr);
      if (!namespaces) {

        // resource [cache]
        const id = 'namespaces';
        let resource = yield select(resourceSelect, id);
        if (!resource) {

          // group [cache]
          const group =
            (yield select(groupSelect, NO_GROUP)) ||
            (yield putTake(groupGet(NO_GROUP), [GROUP_GET__S, GROUP_GET__F])).payload.group;

          // resources [cache]
          (yield select(resourcesSelectByGroup, group)) ||
          (yield putTake(resourcesGet(group), [RESOURCES_GET__S, RESOURCES_GET__F]));

          //
          resource = yield select(resourceSelect, id);
        }

        // items
        const items = (yield putTake(itemsGet(resource), [ITEMS_GET__S, ITEMS_GET__F])).payload.items;

        // namespaces
        namespaces = items.map(item => item.metadata.name);
        namespaces.unshift(NO_NAMESPACE);
        namespaces.sort();
      }

      //
      yield put({
        type: NAMESPACES_GET__S,
        payload: { namespaces },
        meta,
      });
    }

    catch (error) {
      yield put({
        error: true,
        type: NAMESPACES_GET__F,
        payload: error,
        meta,
      });
    }
  });
}

function* sagaNamespaceItemsGet() {
  yield takeEvery(NAMESPACE_ITEMS_GET, function* (action) {
    const { payload, meta } = action;
    const { resolve, reject } = payload;
    try {
      const { namespaceName } = payload;

      // resources [cache]
      const resources = yield select(resourcesSelectByNamespaced, !!namespaceName);

      // items
      yield all(resources.map(resource =>
        putTake(itemsGet(resource, namespaceName), [ITEMS_GET__S, ITEMS_GET__F])
      ));

      //
      yield put({
        type: NAMESPACE_ITEMS_GET__S,
        meta,
      });

      //
      if (resolve) resolve();
    }

    catch (error) {

      //
      yield put({
        error: true,
        type: NAMESPACE_ITEMS_GET__F,
        payload: error,
        meta,
      });

      //
      if (reject) reject();
    }
  });
}

export function* comboSaga() {
  yield all([
    sagaCatalogGet(),
    sagaRbacGet(),
    sagaNamespacesGet(),
    sagaNamespaceItemsGet(),
  ]);
}


// reducer
// ---------

export const comboReducer = {

  [CATALOG_GET__]: (state, action) => {
    const { stage } = action.payload;
    return update(state, {
      flags: {
        [IS_LOADING_CATALOG]: { $set: stage },
      },
    });
  },

  [CATALOG_GET__S]: (state, action) => {
    return update(state, {
      flags: {
        [IS_LOADING_CATALOG]: { $set: null },
      },
    });
  },

  [NAMESPACES_GET__S]: (state, action) => {
    const { namespaces } = action.payload;
    return update(state, {
      namespaces: { $set: namespaces },
    });
  },
};
