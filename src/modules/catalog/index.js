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

export * from './shared';
export * from './groups';
export * from './resources';
export * from './items';

export function* saga() {
  yield all([
    groupsSaga(),
    resourcesSaga(),
    itemsSaga(),
  ]);
}

export const reducer = createReducer(
  {
    ...groupsReducer,
    ...resourcesReducer,
    ...itemsReducer,
  },
  {
    ...groupsState,
    ...resourcesState,
    ...itemsState,
  },
);
