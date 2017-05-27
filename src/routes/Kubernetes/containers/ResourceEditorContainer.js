import { connect } from 'react-redux'
import ResourceEditor from '../components/ResourceEditor'
import { openResource, saveResource, detachEditor, setResourceYaml } from '../modules/editor'

const mapStateToProps = (state) => ({
  resource: state.editor.activeResource,
  resourceYaml : state.editor.activeResourceYaml,
})

const mapDispatchToProps = {
  openResource,
  saveResource,
  setResourceYaml,
  detach: detachEditor,
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourceEditor)
