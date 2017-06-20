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

export * from './shared';
export * from './groups';
export * from './resources';
export * from './items';
export * from './tabs';

export function* saga() {
  yield all([
    groupsSaga(),
    resourcesSaga(),
    itemsSaga(),
    tabsSaga(),
  ]);
}

export const reducer = createReducer(
  {
    ...groupsReducer,
    ...resourcesReducer,
    ...itemsReducer,
    ...tabsReducer,
  },
  {
    ...groupsState,
    ...resourcesState,
    ...itemsState,
    ...tabsState,
  },
);
