import { all, select } from 'redux-saga/effects';
import update from 'immutability-helper';
import jsYaml from 'js-yaml';

import {
  PREFIX,
  putTake,
  takeEveryReq,
} from './shared';

import {
  modelsSelect,
} from './models';

import {
  ITEM_GET__S,
  ITEM_GET__F,
  itemGet,
  itemSelect,
  itemRemoveReadonlyProperties,
} from './items';


// codes
// -------

export const TABS_CLOSE = `${PREFIX}/TABS_CLOSE`;

export const TAB_OPEN = `${PREFIX}/TAB_OPEN`;
export const TAB_OPEN__S = `${PREFIX}/TAB_OPEN/S`;
export const TAB_OPEN__F = `${PREFIX}/TAB_OPEN/F`;

export const TAB_CLOSE = `${PREFIX}/TAB_CLOSE`;


// creators
// ----------

export const tabsClose = () => ({
  type: TABS_CLOSE,
});

export const tabOpen = (id, yaml, _resolve, _reject) => ({
  type: TAB_OPEN,
  payload: { id, yaml },
  promise: { _resolve, _reject },
});

export const tabClose = id => ({
  type: TAB_CLOSE,
  payload: { id },
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
  yield takeEveryReq(
    [
      TAB_OPEN,
      TAB_OPEN__S,
      TAB_OPEN__F,
    ],
    function* (action) {
      let { id, yaml } = action.payload;

      // artificial item
      if (!id) {

        // generate it
        id = `Tab #${getIndex.next().value}`;

        // analyze and clone yaml
        if (yaml) {
          const item = jsYaml.safeLoad(yaml);
          const models = yield select(modelsSelect);
          itemRemoveReadonlyProperties(item, models, item.kind, ['status']);
          yaml = jsYaml.safeDump(item, { noRefs: true });
        }
      }

      // real item
      else {

        // find item
        const item = yield select(itemSelect, id);

        // update yaml
        if (item) yield putTake(itemGet(id), [ITEM_GET__S, ITEM_GET__F]);
      }

      //
      return { id, yaml };
    },
  );
}

export function* tabsSaga() {
  yield all([
    sagaTabOpen(),
  ]);
}


// reducer
// ---------

export const tabsReducer = {

  [TABS_CLOSE]: (state, action) => {
    return update(state, {
      tabs: {
        id: { $set: undefined },
        ids: { $set: [] },
      },
    });
  },

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
};
