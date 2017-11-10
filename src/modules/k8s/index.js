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
  modelsSaga,
  modelsState,
  modelsReducer,
} from './models';

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
export * from './models';
export * from './items';
export * from './tabs';
export * from './combo';
export * from './messages';

export function* saga() {
  yield all([
    groupsSaga(),
    resourcesSaga(),
    modelsSaga(),
    itemsSaga(),
    tabsSaga(),
    comboSaga(),
  ]);
}

export const reducer = createReducer(
  {
    ...groupsReducer,
    ...resourcesReducer,
    ...modelsReducer,
    ...itemsReducer,
    ...tabsReducer,
    ...comboReducer,
  },
  {
    ...groupsState,
    ...resourcesState,
    ...modelsState,
    ...itemsState,
    ...tabsState,
    ...comboState,
  },
);
