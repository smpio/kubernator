import { injectReducer } from '../../store/reducers'
import KubernetesView from './containers/KubernetesViewContainer'
import reducer from './modules/editor'

export default (store) => ({
  getComponent (nextState, cb) {
    injectReducer(store, { key: 'editor', reducer })
    cb(null, KubernetesView)
  },
})
