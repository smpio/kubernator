import { all } from 'redux-saga/effects';
import { createReducer } from '../../utils';

import {
  itemsSaga,
  itemsState,
  itemsReducer,
} from './items';

export * from './shared';
export * from './items';

export function* rbacSaga() {
  yield all([
    itemsSaga(),
  ]);
}

export const rbacReducer = createReducer(
  {
    ...itemsReducer,
  },
  {
    ...itemsState,
  },
);
