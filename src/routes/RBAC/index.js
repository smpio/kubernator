import { injectReducer } from '../../store/reducers'
import RBACView from './containers/RBACViewContainer'
import reducer from './modules/rbac.js'

export default (store) => ({
  path: 'rbac',
  getComponent (nextState, cb) {
    injectReducer(store, { key: 'rbac', reducer })
    cb(null, RBACView)
  },
})
