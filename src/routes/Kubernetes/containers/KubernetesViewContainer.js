import { connect } from 'react-redux'
import KubernetesView from '../components/KubernetesView'

const mapStateToProps = (state) => ({
  showProgressIndicator: state.editor.activeUserActionsCount > 0,
})

export default connect(mapStateToProps)(KubernetesView)
