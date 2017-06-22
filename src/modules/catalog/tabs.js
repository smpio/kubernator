import { all, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import { PREFIX } from './shared';
import { itemGet } from './item';


// codes
// -------

export const TAB_OPEN = `${PREFIX}/TAB_OPEN`;
export const TAB_CLOSE = `${PREFIX}/TAB_CLOSE`;


// creators
// ----------

export const tabOpen = uid => ({
  type: TAB_OPEN,
  payload: { uid },
});

export const tabClose = uid => ({
  type: TAB_CLOSE,
  payload: { uid },
});


// state
// -------

export const tabsState = {
  tabs: [
    /* itemUid */
  ],
};


// saga
// ------

function* sagaTabOpen() {
  yield takeEvery(TAB_OPEN, function* (action) {
    const { uid } = action.payload;
    if (uid) yield put(itemGet(uid));
  });
}

export function* tabsSaga() {
  yield all([
    sagaTabOpen(),
  ]);
}


// reducer
// ---------

export const tabsReducer = {

  [TAB_OPEN]: (state, action) => {
    const { uid = Date.now().toString() } = action.payload;
    return update(state, {
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
