import { connect } from 'react-redux'
import ResourceEditor from '../components/ResourceEditor'

const mapStateToProps = (state) => ({
  resource : state.editor.activeResource,
})

export default connect(mapStateToProps)(ResourceEditor)
