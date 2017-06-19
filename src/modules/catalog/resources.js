import { put, call, takeEvery, all } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  URL,
  KINDS,
  NAMESPACES,
} from './shared';


// action codes
// --------------

export const RESOURCES_GET = `${PREFIX}/RESOURCES_GET`;
export const RESOURCES_GET__S = `${PREFIX}/RESOURCES_GET/S`;
export const RESOURCES_GET__F = `${PREFIX}/RESOURCES_GET/F`;


// action creators
// -----------------

export const resourcesGet = (group, resolve, reject) => ({
  type: RESOURCES_GET,
  payload: { group, resolve, reject },
});


// saga
// ------

async function resourcesFetch(group) {
  const res = await fetch(group[URL]);
  return res.json();
}

function* resourcesGetSaga() {
  yield takeEvery(RESOURCES_GET, function* (action) {
    const { group, resolve, reject } = action.payload;
    try {
      const { resources } = yield call(resourcesFetch, group);

      //
      yield put({
        type: RESOURCES_GET__S,
        payload: { resources },
        meta: { group },
      });

      // resolve antd promise
      yield call(resolve);

    } catch (error) {

      //
      yield put({
        type: RESOURCES_GET__F,
        payload: error,
        error: true,
      });

      // resolve antd promise
      yield call(reject);
    }
  });
}

export function* resourcesSaga() {
  yield all([
    resourcesGetSaga(),
  ]);
}


// reducer
// ---------

export const resourcesState = {
  resources: {
    /* kindName: resourceObject */
  },
};

export const resourcesReducer = {

  [RESOURCES_GET__S]: (state, action) => {
    const { group } = action.meta;
    const { resources } = action.payload;

    // add URL and namespaces to all received resources
    resources.forEach(resource => {
      resource[URL] = `${group[URL]}/${resource.name}`;
      resource[NAMESPACES] = {};
    });

    // save by name
    const names = resources.reduce(
      (names, resource) => {
        names[resource.name] = resource;
        return names;
      },
      {},
    );

    // group by kind
    const kinds = resources.reduce(
      (kinds, resource) => {
        const { name, kind = '[nokind]' } = resource;
        if (!kinds[kind]) kinds[kind] = [];
        kinds[kind].push(name);
        return kinds;
      },
      {},
    );

    //
    return update(state, {
      groups: {
        [group.name]: {
          [KINDS]: { $set: kinds },
        },
      },
      resources: { $merge: names },
    });
  },
};
