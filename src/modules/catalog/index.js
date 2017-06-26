import { all } from 'redux-saga/effects';
import { createReducer } from '../../utils';

import {
  treeSaga,
  treeState,
  treeReducer,
} from './tree';

import {
  itemSaga,
  itemState,
  itemReducer,
} from './item';

import {
  tabsSaga,
  tabsState,
  tabsReducer,
} from './tabs';

export * from './shared';
export * from './tree';
export * from './item';
export * from './tabs';

export function* catalogSaga() {
  yield all([
    treeSaga(),
    itemSaga(),
    tabsSaga(),
  ]);
}

export const catalogReducer = createReducer(
  {
    ...treeReducer,
    ...itemReducer,
    ...tabsReducer,
  },
  {
    ...treeState,
    ...itemState,
    ...tabsState,
  },
);
