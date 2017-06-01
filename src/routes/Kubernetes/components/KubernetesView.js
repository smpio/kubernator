import React from 'react'
import PropTypes from 'prop-types'
import TreeNode from '../containers/TreeNodeContainer'
import ObjectEditor from '../containers/ObjectEditorContainer'
import './KubernetesView.scss'


export const KubernetesView = ({rootModel, showProgressIndicator}) => (
  <div className='kubernetes'>
    <div className={'progressIndicator ' + (showProgressIndicator ? '' : 'hidden')}>
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
KubernetesView.propTypes = {
  rootModel: PropTypes.object.isRequired,
  showProgressIndicator: PropTypes.bool,
}

export default KubernetesView
