import {
  applyMiddleware,
  createStore,
  compose,
} from 'redux'

import createHistory from 'history/createBrowserHistory'

import { routerMiddleware } from 'react-router-redux'
import createSagaMiddleware from 'redux-saga'
import thunkMiddleware from 'redux-thunk'

import modules from './modules'
import sagas from './sagas'

export const history = createHistory()
const sagaMiddleware = createSagaMiddleware()

const initialState = {}

const enhancers = []

const middleware = [
  sagaMiddleware,
  thunkMiddleware,
  routerMiddleware(history)
]

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension
  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension())
  }
}

const composedEnhancers = compose(
  applyMiddleware(...middleware),
  ...enhancers
)

const store = createStore(
  modules,
  initialState,
  composedEnhancers
)

sagaMiddleware.run(sagas)

export default store
