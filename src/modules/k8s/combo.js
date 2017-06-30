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
} from './shared';

import {
  GROUPS_GET__S,
  groupsGet,
  groupSelect,
} from './groups';

import {
  RESOURCES_GET__S,
  resourcesGet,
  resourcesSelectNamespaced,
  resourceSelect,
} from './resources';

import {
  ITEMS_GET__S,
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

export const comboState = {
  flags: {},
  namespaces: [],
};


// saga
// ------

function* sagaCatalogGet() {
  yield takeEvery(CATALOG_GET, function* (action) {
    try {
      const { meta } = action;

      //
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'groups' },
      });
      yield delay(0);

      // get groups
      const { payload: { groups }} = yield putTake(groupsGet(), GROUPS_GET__S);

      //
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'resources' },
      });
      yield delay(0);

      // get resources
      yield all(groups.map(group => putTake(resourcesGet(group), RESOURCES_GET__S)));

      //
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'namespaces' },
      });
      yield delay(0);

      // get namespaces
      yield putTake(namespacesGet(), NAMESPACES_GET__S);

      //
      yield put({
        type: CATALOG_GET__S,
        meta,
      });
    }
    catch (error) {
      yield put({
        type: CATALOG_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaRbacGet() {
  yield takeEvery(RBAC_GET, function* (action) {
    try {
      const { meta } = action;

      // group
      const id = 'rbac.authorization.k8s.io';
      let group = yield select(groupSelect, id);
      if (!group) {
        yield putTake(groupsGet(), GROUPS_GET__S);
        group = yield select(groupSelect, id);
      }

      // resources
      const { payload: { resources }} = yield putTake(resourcesGet(group), RESOURCES_GET__S);

      // items
      yield all(resources.map(resource => putTake(itemsGet(resource), ITEMS_GET__S)));
      
      //
      yield put({
        type: RBAC_GET__S,
        meta,
      });
    }
    catch (error) {
      yield put({
        type: RBAC_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaNamespacesGet() {
  yield takeEvery(NAMESPACES_GET, function* (action) {
    try {
      const { meta } = action;

      // resource
      const id = 'namespaces';
      let resource = yield select(resourceSelect, id);
      if (!resource) {

        // group
        let group = yield select(groupSelect, NO_GROUP);
        if (!group) {
          yield putTake(groupsGet(), GROUPS_GET__S);
          group = yield select(groupSelect, NO_GROUP);
        }

        // resources
        if (!group[RESOURCE_IDS].length) {
          yield putTake(resourcesGet(group), RESOURCES_GET__S);
        }

        //
        resource = yield select(resourceSelect, id);
      }

      // items
      const { payload: { items }} = yield putTake(itemsGet(resource), ITEMS_GET__S);

      // namespaces
      const namespaces = items.map(item => item.metadata.name);
      namespaces.unshift(NO_NAMESPACE);
      namespaces.sort();

      //
      yield put({
        type: NAMESPACES_GET__S,
        payload: { namespaces },
        meta,
      });
    }

    catch (error) {
      yield put({
        type: NAMESPACES_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaNamespaceItemsGet() {
  yield takeEvery(NAMESPACE_ITEMS_GET, function* (action) {
    const { resolve, reject } = action.payload;
    try {
      const { payload, meta } = action;
      const { namespaceName } = payload;

      // resources
      const resources = yield select(resourcesSelectNamespaced, !!namespaceName);

      // items
      yield all(resources.map(resource =>
        putTake(itemsGet(resource, namespaceName), ITEMS_GET__S)
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
        type: NAMESPACE_ITEMS_GET__F,
        payload: error,
        error: true,
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
