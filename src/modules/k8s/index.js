import { all } from 'redux-saga/effects';
import { createReducer } from '../../utils';

import {
  groupsSaga,
  groupsState,
  groupsReducer,
} from './groups';

import {
  resourcesSaga,
  resourcesState,
  resourcesReducer,
} from './resources';

import {
  itemsSaga,
  itemsState,
  itemsReducer,
} from './items';

import {
  tabsSaga,
  tabsState,
  tabsReducer,
} from './tabs';

import {
  comboSaga,
  comboState,
  comboReducer,
} from './combo';

export * from './shared';
export * from './groups';
export * from './resources';
export * from './items';
export * from './tabs';
export * from './combo';

export function* saga() {
  yield all([
    groupsSaga(),
    resourcesSaga(),
    itemsSaga(),
    tabsSaga(),
    comboSaga(),
  ]);
}

export const reducer = createReducer(
  {
    ...groupsReducer,
    ...resourcesReducer,
    ...itemsReducer,
    ...tabsReducer,
    ...comboReducer,
  },
  {
    ...groupsState,
    ...resourcesState,
    ...itemsState,
    ...tabsState,
    ...comboState,
  },
);
