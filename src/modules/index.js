import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { all } from 'redux-saga/effects';

import {
  PREFIX as catalogPrefix,
  reducer as catalogReducer,
  saga as catalogSaga,
} from './catalog';

export function * sagas() {
  yield all([
    catalogSaga(),
  ]);
}

export const reducers = combineReducers({
  router: routerReducer,
  [catalogPrefix]: catalogReducer,
});
