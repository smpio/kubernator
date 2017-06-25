import { all, call, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  toKeysObject,
} from '../../utils';

import {
  PREFIX,
  ID,
  RESOURCE,
  RESOURCE_ROLE,
  RESOURCE_CLUSTER_ROLE,
  RESOURCE_ROLE_BINDING,
  RESOURCE_CLUSTER_ROLE_BINDING,
} from './shared';


// codes
// -------

export const RBAC_GET = `${PREFIX}/RBAC_GET`;
export const RBAC_GET__S = `${PREFIX}/RBAC_GET/S`;
export const RBAC_GET__F = `${PREFIX}/RBAC_GET/F`;


// creators
// ----------

export const rbacGet = () => ({
  type: RBAC_GET,
});


// api
// -----

async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}


// state
// -------

export const mainState = {
  roles: {},
  bindings: {},
};


// saga
// ------

function* sagaRbacGet() {
  yield takeEvery(RBAC_GET, function* (action) {
    try {

      // get api groups
      const { groups } = yield call(apiGet, '/apis');

      // find rbac group
      const group = groups.find(group => group.name === 'rbac.authorization.k8s.io');
      const groupUrl = group.preferredVersion.groupVersion;

      // get rbac resources
      const { resources } = yield call(apiGet, `/apis/${groupUrl}`);

      // for every resource get items
      const data = yield all(
        resources.map(resource =>
          call(apiGet, `/apis/${groupUrl}/${resource.name}`),
        ),
      );
      
      // extract items
      const items = data.reduce(
        (result, resource) => {
          const { kind, items } = resource;
          items.forEach(item => {
            item[ID] = item.metadata.uid;
            item[RESOURCE] = kind;
          });
          return result.concat(items);
        },
        [],
      );

      // build result
      const roles = toKeysObject(items.filter(item =>
        item[RESOURCE] === RESOURCE_ROLE ||
        item[RESOURCE] === RESOURCE_CLUSTER_ROLE
      ), ID);
      const bindings = toKeysObject(items.filter(item =>
        item[RESOURCE] === RESOURCE_ROLE_BINDING ||
        item[RESOURCE] === RESOURCE_CLUSTER_ROLE_BINDING
      ), ID);

      //
      yield put({
        type: RBAC_GET__S,
        payload: { roles, bindings },
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

export function* mainSaga() {
  yield all([
    sagaRbacGet(),
  ]);
}


// reducer
// ---------

export const mainReducer = {

  [RBAC_GET__S]: (state, action) => {
    const { roles, bindings } = action.payload;
    return update(state, {
      roles: { $set: roles },
      bindings: { $set: bindings },
    });
  },
};
