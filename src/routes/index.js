import CoreLayout from '../layouts/PageLayout/PageLayout'
import KubernetesRoute from './Kubernetes'
import RBACRoute from './RBAC'

export const createRoutes = (store) => ({
  path        : '/',
  component   : CoreLayout,
  indexRoute  : KubernetesRoute(store),
  childRoutes : [
    RBACRoute(store),
  ]
})

export default createRoutes
