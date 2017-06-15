import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import { all } from 'redux-saga/effects'

import kubernetes from './kubernetes'
import counter, { saga as sagaCounter } from './counter'

export function * sagas () {
  yield all([
    sagaCounter(),
  ])
}

export const reducers = combineReducers({
  router: routerReducer,
  editor: kubernetes,
  counter,
})
