import {
  applyMiddleware,
  createStore,
  compose,
} from 'redux';

import createHistory from 'history/createHashHistory';

import { routerMiddleware } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import thunkMiddleware from 'redux-thunk';

import customMiddleware from './middleware';
import { reducers, sagas } from './modules';

export const history = createHistory();
const sagaMiddleware = createSagaMiddleware();

const initialState = {};

const enhancers = [];

const middleware = [
  sagaMiddleware,
  thunkMiddleware,
  routerMiddleware(history),
  ...customMiddleware,
];

if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension;
  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(
  applyMiddleware(...middleware),
  ...enhancers
);

const store = createStore(
  reducers,
  initialState,
  composedEnhancers
);

sagaMiddleware.run(sagas);

export default store;
