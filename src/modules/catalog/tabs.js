import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';
import jsYaml from 'js-yaml';

import { PREFIX, YAML } from './shared';
import { itemGet, stateItemGet } from './item';


// codes
// -------

export const TAB_OPEN = `${PREFIX}/TAB_OPEN`;
export const TAB_OPEN__S = `${PREFIX}/TAB_OPEN/S`;
export const TAB_OPEN__F = `${PREFIX}/TAB_OPEN/F`;

export const TAB_CLOSE = `${PREFIX}/TAB_CLOSE`;
export const TAB_CLOSEALL = `${PREFIX}/TAB_CLOSEALL`;


// creators
// ----------

export const tabOpen = (id, yaml, resolve, reject) => ({
  type: TAB_OPEN,
  payload: { id, yaml, resolve, reject },
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
// yamls are in the local component's state
// for performance reasons

export const tabsState = {
  tabs: {
    id: null,
    ids: [
      /* itemId */
    ],
  },
};


// saga
// ------

const getIndex = (function* () {
  let index = 0;
  while (true) yield ++index;
})();

function* sagaTabOpen() {
  yield takeEvery(TAB_OPEN, function* (action) {
    const { resolve, reject } = action.payload;
    try {
      let { id, yaml } = action.payload;

      // artificial item
      if (!id) {

        // generate it
        id = `Tab #${getIndex.next().value}`;

        // analyze and clone yaml
        if (yaml) {
          const item = jsYaml.safeLoad(yaml);
          yaml = jsYaml.safeDump(item, { noRefs: true });
        }
      }

      // real item
      else {

        // find item
        const item = yield select(stateItemGet, id);

        // request yaml only if needed
        if (item && !item[YAML]) yield put(itemGet(id));
      }

      // callback
      if (resolve) yield call(resolve, { id, yaml });

      //
      yield put({
        type: TAB_OPEN__S,
        payload: { id },
      });
    }

    catch (error) {

      // callback
      if (reject) yield call(reject);

      //
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
    sagaTabOpen(),
  ]);
}


// reducer
// ---------

export const tabsReducer = {

  [TAB_OPEN__S]: (state, action) => {
    const { id } = action.payload;
    return update(state, {
      tabs: {
        id: { $set: id },
        ids: { $pushuniq: [id] },
      },
    });
  },

  [TAB_CLOSE]: (state, action) => {
    const { id: idClose } = action.payload;
    const { id: idActive, ids } = state.tabs;

    // calc next active tab
    let idNext;
    if (idClose !== idActive) idNext = idActive;
    else {
      const indexClose = ids.indexOf(idClose);
      const indexNext = indexClose !== 0 ? indexClose - 1 : indexClose + 1;
      idNext = ids[indexNext];
    }

    //
    return update(state, {
      tabs: {
        id: { $set: idNext },
        ids: { $pop: [idClose] },
      },
    });
  },

  [TAB_CLOSEALL]: (state, action) => {
    return update(state, {
      tabs: {
        id: { $set: undefined },
        ids: { $set: [] },
      },
    });
  },
};
