import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  URL,
  YAML,
} from './shared';


// action codes
// --------------

export const TAB_OPEN = `${PREFIX}/TAB_OPEN`;
export const TAB_OPEN__S = `${PREFIX}/TAB_OPEN/S`;
export const TAB_OPEN__F = `${PREFIX}/TAB_OPEN/F`;

export const TAB_CLOSE = `${PREFIX}/TAB_CLOSE`;


// action creators
// -----------------

export const tabOpen = uid => ({
  type: TAB_OPEN,
  payload: { uid },
});

export const tabClose = uid => ({
  type: TAB_CLOSE,
  payload: { uid },
});


// saga
// ------

async function tabFetch(item) {
  const res = await fetch(
    item[URL],
    {
      headers: {
        'Accept': 'application/yaml',
      },
    },
  );
  return res.text();
}

function itemGet(state, uid) {
  return state[PREFIX].items[uid];
}

function* tabOpenSaga() {
  yield takeEvery(TAB_OPEN, function* (action) {
    try {
      const { uid } = action.payload;
      const item = yield select(itemGet, uid);
      const yaml = yield call(tabFetch, item);
      yield put({
        type: TAB_OPEN__S,
        payload: { yaml },
        meta: { uid },
      });
    } catch (error) {
      yield put({
        type: TAB_OPEN__F,
        payload: error,
        error: true,
      });
    }
  });
}

export function* tabsSaga() {
  yield all([
    tabOpenSaga(),
  ]);
}


// reducer
// ---------

export const tabsState = {
  tabs: [
    /* itemUid */
  ],
};

export const tabsReducer = {

  [TAB_OPEN__S]: (state, action) => {
    const { uid } = action.meta;
    const { yaml } = action.payload;
    return update(state, {
      items: {
        [uid]: {
          [YAML]: { $set: yaml },
        },
      },
      tabs: { $push: [uid] },
    });
  },

  [TAB_CLOSE]: (state, action) => {
    const { uid } = action.payload;
    return update(state, {
      tabs: { $pop: [uid] },
    });
  },
};
