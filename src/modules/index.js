import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { all } from 'redux-saga/effects';

import kubernetes from './kubernetes';
import {
  PREFIX as catalogPrefix,
  reducer as catalogReducer,
  saga as catalogSaga,
} from './catalog';
import {
  reducer as counterReducer,
  saga as counterSaga,
} from './counter';

export function * sagas() {
  yield all([
    catalogSaga(),
    counterSaga(),
  ]);
}

export const reducers = combineReducers({
  router: routerReducer,
  [catalogPrefix]: catalogReducer,
  editor: kubernetes,
  counter: counterReducer,
});
