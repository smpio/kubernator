import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { all } from 'redux-saga/effects';

import {
  PREFIX as k8sPrefix,
  reducer as k8sReducer,
  saga as k8sSaga,
} from './k8s';

export function * sagas() {
  yield all([
    k8sSaga(),
  ]);
}

export const reducers = combineReducers({
  router: routerReducer,
  [k8sPrefix]: k8sReducer,
});
