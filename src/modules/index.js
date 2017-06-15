import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import kubernetes from './kubernetes'
import counter from './counter'

export default combineReducers({
  router: routerReducer,
  editor: kubernetes,
  counter,
})
