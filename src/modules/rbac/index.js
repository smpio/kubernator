import { all } from 'redux-saga/effects';
import { createReducer } from '../../utils';

import {
  mainSaga,
  mainState,
  mainReducer,
} from './main';

export * from './shared';
export * from './main';

export function* rbacSaga() {
  yield all([
    mainSaga(),
  ]);
}

export const rbacReducer = createReducer(
  {
    ...mainReducer,
  },
  {
    ...mainState,
  },
);
