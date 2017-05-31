import React from 'react'
import PropTypes from 'prop-types'
import './TreeNode.scss'


export const TreeNode = ({model, clickTreeNode}) => (
  <div className={'node ' + (model.isEmpty ? '' : 'empty')}>
    <div onClick={() => clickTreeNode(model)}>{model.visibleName}</div>
    {model.isOpened && (
      <ul>
        {model.childIds.map(childId => (
          <li key={childId}>
            <TreeNodeContainer id={childId} />
          </li>
        ))}
      </ul>
    )}
  </div>
)
TreeNode.propTypes = {
  model: PropTypes.object.isRequired,
  clickTreeNode: PropTypes.func.isRequired,
}

import TreeNodeContainer from '../containers/TreeNodeContainer'  // used to render childs
export default TreeNode
