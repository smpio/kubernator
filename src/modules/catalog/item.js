import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';
import jsYaml from 'js-yaml';

import {
  PREFIX,
  URL,
  YAML,
} from './shared';


// action codes
// --------------

export const ITEM_GET = `${PREFIX}/ITEM_GET`;
export const ITEM_GET__S = `${PREFIX}/ITEM_GET/S`;
export const ITEM_GET__F = `${PREFIX}/ITEM_GET/F`;

export const ITEM_POST = `${PREFIX}/ITEM_POST`;
export const ITEM_POST__S = `${PREFIX}/ITEM_POST/S`;
export const ITEM_POST__F = `${PREFIX}/ITEM_POST/F`;

export const ITEM_PUT = `${PREFIX}/ITEM_PUT`;
export const ITEM_PUT__S = `${PREFIX}/ITEM_PUT/S`;
export const ITEM_PUT__F = `${PREFIX}/ITEM_PUT/F`;

export const ITEM_DELETE = `${PREFIX}/ITEM_DELETE`;
export const ITEM_DELETE__S = `${PREFIX}/ITEM_DELETE/S`;
export const ITEM_DELETE__F = `${PREFIX}/ITEM_DELETE/F`;


// action creators
// -----------------

export const itemGet = uid => ({
  type: ITEM_GET,
  payload: { uid },
});

export const itemPost = (uid, yaml) => ({
  type: ITEM_POST,
  payload: { uid, yaml },
});

export const itemPut = (uid, yaml) => ({
  type: ITEM_PUT,
  payload: { uid, yaml },
});

export const itemDelete = uid => ({
  type: ITEM_DELETE,
  payload: { uid },
});


// api
// -----

async function apiItemGet(url) {
  const res = await fetch(url);
  return res.json();
}

async function apiItemGetYaml(url) {
  const res = await fetch(
    url,
    {
      headers: {
        'Accept': 'application/yaml',
      },
    },
  );
  return res.text();
}

async function apiItemPost(url, yaml) {
  const res = await fetch(
    url,
    {
      method: 'POST',
      body: yaml,
      headers: {
        'Content-Type': 'application/yaml',
      },
    },
  );
  return res.json();
}

async function apiItemPut(url, yaml) {
  const res = await fetch(
    url,
    {
      method: 'PUT',
      body: yaml,
      headers: {
        'Content-Type': 'application/yaml',
      },
    },
  );
  return res.json();
}

async function apiItemDelete(url) {
  const res = await fetch(
    url,
    {
      method: 'DELETE',
    },
  );
  return res.json();
}


// state
// -------

function stateItemGet(state, uid) {
  return state[PREFIX].items[uid];
}

export const itemState = {};


// saga
// ------

function* sagaItemGet() {
  yield takeEvery(ITEM_GET, function* (action) {
    try {
      const { uid } = action.payload;
      const item = yield select(stateItemGet, uid);
      if (item) {
        const yaml = yield call(apiItemGetYaml, item[URL]);
        yield put({
          type: ITEM_GET__S,
          payload: { yaml },
          meta: { uid },
        });
      }
    } catch (error) {
      yield put({
        type: ITEM_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaItemPost() {
  yield takeEvery(ITEM_POST, function* (action) {
    try {
      const { uid, yaml } = action.payload;
      const item = jsYaml.safeLoad(yaml);
      const { [URL]: url } = yield select(stateItemGet, uid);
      const yaml2 = yield call(apiItemPost, url, yaml);
      //const item = yield call(apiItemGet, url);
      yield put({
        type: ITEM_POST__S,
        payload: { item },
        meta: { uid },
      });
    } catch (error) {
      yield put({
        type: ITEM_POST__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaItemPut() {
  yield takeEvery(ITEM_PUT, function* (action) {
    try {
      const { uid, yaml } = action.payload;
      const { [URL]: url } = yield select(stateItemGet, uid);

      // put
      const res = yield call(apiItemPut, url, yaml);
      if (res.status === 'Failure') throw res;

      //
      yield put({
        type: ITEM_PUT__S,
        payload: { item: res },
        meta: { uid, yaml },
      });
    } catch (error) {
      yield put({
        type: ITEM_PUT__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaItemDelete() {
  yield takeEvery(ITEM_POST, function* (action) {
    try {
      const { uid } = action.payload;
      const { [URL]: url } = yield select(stateItemGet, uid);
      const yaml = yield call(apiItemDelete, url);
      yield put({
        type: ITEM_DELETE__S,
        payload: {},
        meta: { uid },
      });
    } catch (error) {
      yield put({
        type: ITEM_DELETE__F,
        payload: error,
        error: true,
      });
    }
  });
}

export function* itemSaga() {
  yield all([
    sagaItemGet(),
    sagaItemPost(),
    sagaItemPut(),
    sagaItemDelete(),
  ]);
}


// reducer
// ---------

export const itemReducer = {

  [ITEM_GET__S]: (state, action) => {
    const { uid } = action.meta;
    const { yaml } = action.payload;
    return update(state, {
      items: {
        [uid]: {
          $merge: {
            [YAML]: yaml,
          },
        },
      },
    });
  },

  [ITEM_PUT__S]: (state, action) => {
    const { uid, yaml } = action.meta;
    const { item } = action.payload;
    return update(state, {
      items: {
        [uid]: {
          $set: {
            ...item,
            [YAML]: yaml,
          },
        },
      },
    });
  },
};
