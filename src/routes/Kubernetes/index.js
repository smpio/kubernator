import { injectReducer } from '../../store/reducers'
import KubernetesView from './components/KubernetesView'
import reducer from './modules/editor'

export default (store) => ({
  path: 'kubernetes',
  getComponent (nextState, cb) {
    injectReducer(store, { key: 'editor', reducer })
    cb(null, KubernetesView)
  },
})
