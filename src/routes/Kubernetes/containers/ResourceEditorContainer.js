import { connect } from 'react-redux'
import ResourceEditor from '../components/ResourceEditor'
import { actions } from '../modules/editor'

const mapStateToProps = (state) => ({
  resource: state.editor.activeResource,
  resourceYaml : state.editor.activeResourceYaml,
})

export default connect(mapStateToProps, actions)(ResourceEditor)
