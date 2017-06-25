import { all, call, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  toKeysObject,
} from '../../utils';

import {
  PREFIX,
  ID,
  RESOURCE,
} from './shared';


// codes
// -------

export const ITEMS_GET = `${PREFIX}/ITEMS_GET`;
export const ITEMS_GET__S = `${PREFIX}/ITEMS_GET/S`;
export const ITEMS_GET__F = `${PREFIX}/ITEMS_GET/F`;


// creators
// ----------

export const itemsGet = () => ({
  type: ITEMS_GET,
});


// api
// -----

async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}


// state
// -------

export const itemsState = {
  items: {},
};


// saga
// ------

function* sagaItemsGet() {
  yield takeEvery(ITEMS_GET, function* (action) {
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

      //
      yield put({
        type: ITEMS_GET__S,
        payload: { items },
      });
    }
    catch (error) {
      yield put({
        type: ITEMS_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

export function* itemsSaga() {
  yield all([
    sagaItemsGet(),
  ]);
}


// reducer
// ---------

export const itemsReducer = {

  [ITEMS_GET__S]: (state, action) => {
    const { items } = action.payload;
    return update(state, {
      items: { $set: toKeysObject(items, ID) },
    });
  },
};
