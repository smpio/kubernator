import React from 'react'
import PropTypes from 'prop-types'
import TreeNode from '../containers/TreeNodeContainer'
import ResourceEditor from '../containers/ResourceEditorContainer'
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
      <ResourceEditor />
    </div>
  </div>
)
KubernetesView.propTypes = {
  rootModel: PropTypes.object.isRequired,
  showProgressIndicator: PropTypes.bool,
}

export default KubernetesView
