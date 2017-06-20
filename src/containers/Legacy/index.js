import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import TreeNode from './TreeNode'
import ObjectEditor from './ObjectEditor'

import classnames from 'classnames'
import './index.css'

class Legacy extends React.Component {
  render () {
    const {
      rootModel,
      showProgressIndicator
    } = this.props

    return (
      <div className='kubernetes'>
        <div className={classnames('progressIndicator', { hidden: !showProgressIndicator })}>
          Loading...
        </div>
        <div className='tree'>
          <TreeNode id={rootModel.id} />
        </div>
        <div className='editor'>
          <ObjectEditor />
        </div>
      </div>
    )
  }
}

Legacy.propTypes = {
  rootModel: PropTypes.object.isRequired,
  showProgressIndicator: PropTypes.bool,
}

export default connect(
  state => ({
    rootModel: state.editor.rootNode,
    showProgressIndicator: state.editor.activeUserActionsCount > 0,
  }),
)(Legacy)
