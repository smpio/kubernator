import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { all } from 'redux-saga/effects';

import {
  PREFIX as catalogPrefix,
  catalogReducer,
  catalogSaga,
} from './catalog';

import {
  PREFIX as rbacPrefix,
  rbacReducer,
  rbacSaga,
} from './rbac';

export function * sagas() {
  yield all([
    catalogSaga(),
    rbacSaga(),
  ]);
}

export const reducers = combineReducers({
  router: routerReducer,
  [catalogPrefix]: catalogReducer,
  [rbacPrefix]: rbacReducer,
});
