import { connect } from 'react-redux'
import ObjectEditor from '../components/ObjectEditor'
import { actions } from '../modules/editor'

const mapStateToProps = (state) => ({
  object: state.editor.activeObject,
  yaml : state.editor.activeObjectYaml,
})

export default connect(mapStateToProps, actions)(ObjectEditor)
