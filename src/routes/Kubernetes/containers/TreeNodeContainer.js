import { connect } from 'react-redux'
import TreeNode from '../components/TreeNode'
import { actions } from '../modules/editor'


const mapStateToProps = (state) => ({
})

export default connect(mapStateToProps, actions)(TreeNode)
