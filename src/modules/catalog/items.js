import { put, call, takeEvery, all } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  URL,
  UID,
  NAMESPACES,
} from './shared';


// action codes
// --------------

export const ITEMS_GET = `${PREFIX}/ITEMS_GET`;
export const ITEMS_GET__S = `${PREFIX}/ITEMS_GET/S`;
export const ITEMS_GET__F = `${PREFIX}/ITEMS_GET/F`;


// action creators
// -----------------

export const itemsGet = (resource, resolve, reject) => ({
  type: ITEMS_GET,
  payload: { resource, resolve, reject },
});


// saga
// ------

async function itemsFetch(resource) {
  const res = await fetch(resource[URL]);
  return res.json();
}

function* itemsGetSaga() {
  yield takeEvery(ITEMS_GET, function* (action) {
    const { resource, resolve, reject } = action.payload;
    try {
      const { items } = yield call(itemsFetch, resource);

      //
      yield put({
        type: ITEMS_GET__S,
        payload: { items },
        meta: { resource },
      });

      // resolve antd promise
      yield call(resolve);

    } catch (error) {

      //
      yield put({
        type: ITEMS_GET__F,
        payload: error,
        error: true,
      });

      // resolve antd promise
      yield call(reject);
    }
  });
}

export function* itemsSaga() {
  yield all([
    itemsGetSaga(),
  ]);
}


// reducer
// ---------

export const itemsState = {
  items: {
    /* itemUid: itemObject */
  },
};

export const itemsReducer = {

  [ITEMS_GET__S]: (state, action) => {
    const { resource } = action.meta;
    const { items } = action.payload;

    // add URL and UID to all received items
    items.forEach(item => {
      const { uid, namespace, name, selfLink } = item.metadata;
      item[URL] = namespace ? selfLink : `${resource[URL]}/${name}`;
      item[UID] = uid || `[nouid]-${name}`;
    });

    // group by namespace
    const namespaces = items.reduce(
      (namespaces, item) => {
        const { [UID]: uid, metadata: { namespace = '[nonamespace]' }} = item;
        if (!namespaces[namespace]) namespaces[namespace] = [];
        namespaces[namespace].push(uid);
        return namespaces;
      },
      {},
    );

    // save by uid
    const uids = items.reduce(
      (uids, item) => {
        uids[item[UID]] = item;
        return uids;
      },
      {},
    );

    //
    return update(state, {
      resources: {
        [resource.name]: {
          [NAMESPACES]: { $set: namespaces },
        },
      },
      items: { $merge: uids },
    });
  },
};
