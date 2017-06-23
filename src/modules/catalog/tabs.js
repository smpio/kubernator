import { all, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import { PREFIX } from './shared';
import { itemGet } from './item';


// codes
// -------

export const TAB_OPEN = `${PREFIX}/TAB_OPEN`;
export const TAB_CLOSE = `${PREFIX}/TAB_CLOSE`;
export const TAB_CLOSEALL = `${PREFIX}/TAB_CLOSEALL`;


// creators
// ----------

export const tabOpen = id => ({
  type: TAB_OPEN,
  payload: { id },
});

export const tabClose = id => ({
  type: TAB_CLOSE,
  payload: { id },
});

export const tabCloseAll = () => ({
  type: TAB_CLOSEALL,
});


// state
// -------

export const tabsState = {
  tabs: [
    /* itemId */
  ],
};


// saga
// ------

function* sagaTabOpen() {
  yield takeEvery(TAB_OPEN, function* (action) {
    const { id } = action.payload;
    if (id) yield put(itemGet(id));
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
    const { id = Date.now().toString() } = action.payload;
    return update(state, {
      tabs: { $push: [id] },
    });
  },

  [TAB_CLOSE]: (state, action) => {
    const { id } = action.payload;
    return update(state, {
      tabs: { $pop: [id] },
    });
  },

  [TAB_CLOSEALL]: (state, action) => {
    return update(state, {
      tabs: { $set: [] },
    });
  },
};
