import { connect } from 'react-redux'
import ResourceEditor from '../components/ResourceEditor'

const mapStateToProps = (state) => ({
  resourceYaml : state.editor.activeResourceYaml,
})

export default connect(mapStateToProps)(ResourceEditor)
