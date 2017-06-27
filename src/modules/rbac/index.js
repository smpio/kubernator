import { all } from 'redux-saga/effects';
import { createReducer } from '../../utils';

import {
  itemsSaga,
  itemsState,
  itemsReducer,
} from './items';

import {
  namespacesSaga,
  namespacesState,
  namespacesReducer,
} from './namespaces';

export * from './shared';
export * from './items';
export * from './namespaces';

export function* rbacSaga() {
  yield all([
    itemsSaga(),
    namespacesSaga(),
  ]);
}

export const rbacReducer = createReducer(
  {
    ...itemsReducer,
    ...namespacesReducer,
  },
  {
    ...itemsState,
    ...namespacesState,
  },
);
