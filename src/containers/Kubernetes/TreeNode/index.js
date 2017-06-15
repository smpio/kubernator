import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import {
  clickTreeNode,
} from '../../../modules/kubernetes'

import classnames from 'classnames'
import './index.css'

class TreeNodeInner extends React.Component {
  constructor (props) {
    super(props)
    this.clickTreeNode = this.clickTreeNode.bind(this)
  }

  clickTreeNode () {
    const { model, clickTreeNode } = this.props
    return clickTreeNode(model)
  }

  render () {
    const {
      props: {
        model,
      },
      clickTreeNode,
    } = this

    return (
      <div
        title={model.error}
        className={classnames('node', {
          empty: !model.isEmpty,
          error: model.error
        })}>
        <div onClick={clickTreeNode}>
          {model.isOpened ? '▾ ' : '▸ '}
          {model.visibleName}
        </div>
        {
          model.isOpened &&
          <ul>
            {
              model.childIds.map(childId =>
                <li key={childId}>
                  <TreeNode id={childId} />
                </li>
              )
            }
          </ul>
        }
      </div>
    )
  }
}

TreeNodeInner.propTypes = {
  model: PropTypes.object.isRequired,
  clickTreeNode: PropTypes.func.isRequired,
}

const TreeNode = connect(
  (state, props) => ({
    model: state.editor.nodes[props.id],
  }),
  dispatch => bindActionCreators({
    clickTreeNode,
  }, dispatch),
)(TreeNodeInner)

export default TreeNode
