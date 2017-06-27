import { all, call, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  NONAMESPACE,
} from './shared';


// codes
// -------

export const NAMESPACES_GET = `${PREFIX}/NAMESPACES_GET`;
export const NAMESPACES_GET__S = `${PREFIX}/NAMESPACES_GET/S`;
export const NAMESPACES_GET__F = `${PREFIX}/NAMESPACES_GET/F`;

export const NAMESPACE_SET = `${PREFIX}/NAMESPACE_SET`;


// creators
// ----------

export const namespacesGet = () => ({
  type: NAMESPACES_GET,
});

export const namespaceSet = namespaceIndex => ({
  type: NAMESPACE_SET,
  payload: { namespaceIndex },
});


// api
// -----

async function apiGet(url) {
  const res = await fetch(url);
  return res.json();
}


// state
// -------

export const namespacesState = {
  namespaces: [],
  namespaceIndex: 0,
};


// saga
// ------

function* sagaNamespacesGet() {
  yield takeEvery(NAMESPACES_GET, function* (action) {
    try {

      // get
      const { items } = yield call(apiGet, 'api/v1/namespaces');

      // parse
      const namespaces = items.map(item => item.metadata.name);

      // add fake
      namespaces.unshift(NONAMESPACE);

      // sort
      namespaces.sort();

      //
      yield put({
        type: NAMESPACES_GET__S,
        payload: { namespaces },
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

export function* namespacesSaga() {
  yield all([
    sagaNamespacesGet(),
  ]);
}


// reducer
// ---------

export const namespacesReducer = {

  [NAMESPACES_GET__S]: (state, action) => {
    const { namespaces } = action.payload;
    return update(state, {
      namespaces: { $set: namespaces },
    });
  },

  [NAMESPACE_SET]: (state, action) => {
    const { namespaceIndex } = action.payload;
    return update(state, {
      namespaceIndex: { $set: namespaceIndex },
    });
  },
};
