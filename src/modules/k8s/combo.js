import { all, put, select } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  RESOURCE_IDS,
  IS_LOADING_CATALOG,
  NO_GROUP,
  NO_NAMESPACE,
  putTake,
  takeEveryReq,
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

export const catalogGet = ({ forceNamespaces } = {}) => ({
  type: CATALOG_GET,
  payload: { forceNamespaces },
});

export const rbacGet = () => ({
  type: RBAC_GET,
});

export const namespacesGet = () => ({
  type: NAMESPACES_GET,
});

export const namespaceItemsGet = (namespaceName, _resolve, _reject) => ({
  type: NAMESPACE_ITEMS_GET,
  payload: { namespaceName },
  promise: { _resolve, _reject },
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
  yield takeEveryReq(
    [
      CATALOG_GET,
      CATALOG_GET__S,
      CATALOG_GET__F,
    ],
    function* (action) {
      const { forceNamespaces } = action.payload;

      // groups <- [state] <- [storage] <- [api]
      let groups = yield select(groupsSelectArr);
      if (!groups) {
        yield put({
          type: CATALOG_GET__,
          payload: { stage: 'groups' },
        });
        groups = (yield putTake(groupsGet(), [GROUPS_GET__S, GROUPS_GET__F])).payload.groups;
      }

      // resources <- [state] <- [storage] <- [api]
      yield put({
        type: CATALOG_GET__,
        payload: { stage: 'resources' },
      });
      yield all(groups
        .filter(group => !group[RESOURCE_IDS].length)
        .map(group => putTake(resourcesGet(group), [RESOURCES_GET__S, RESOURCES_GET__F]))
      );

      // namespaces <- [state] <- [storage] <- [api]
      let namespaces;
      if (!forceNamespaces) namespaces = yield select(namespacesSelectArr);
      if (!namespaces) {
        yield put({
          type: CATALOG_GET__,
          payload: { stage: 'namespaces' },
        });
        yield putTake(namespacesGet(), [NAMESPACES_GET__S, NAMESPACES_GET__F]);
      }

      //
      return {};
    },
  );
}

function* sagaRbacGet() {
  yield takeEveryReq(
    [
      RBAC_GET,
      RBAC_GET__S,
      RBAC_GET__F,
    ],
    function* (action) {

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
      return {};
    },
  );
}

function* sagaNamespacesGet() {
  yield takeEveryReq(
    [
      NAMESPACES_GET,
      NAMESPACES_GET__S,
      NAMESPACES_GET__F,
    ],
    function* (action) {

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
      const { items } = (yield putTake(itemsGet(resource), [ITEMS_GET__S, ITEMS_GET__F])).payload;

      // namespaces
      let namespaces = items.map(item => item.metadata.name);
      namespaces.unshift(NO_NAMESPACE);
      namespaces.sort();

      //
      return { namespaces };
    },
  );
}

function* sagaNamespaceItemsGet() {
  yield takeEveryReq(
    [
      NAMESPACE_ITEMS_GET,
      NAMESPACE_ITEMS_GET__S,
      NAMESPACE_ITEMS_GET__F,
    ],
    function* (action) {
      const { namespaceName } = action.payload;

      // resources [cache]
      const resources = yield select(resourcesSelectByNamespaced, !!namespaceName);

      // items
      yield all(resources.map(resource =>
        putTake(itemsGet(resource, namespaceName), [ITEMS_GET__S, ITEMS_GET__F])
      ));

      //
      return {};
    },
  );
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
