import React from 'react'
import PropTypes from 'prop-types'
import TreeNode from '../containers/TreeNodeContainer'
import ResourceEditor from '../containers/ResourceEditorContainer'
import './KubernetesView.scss'


export const KubernetesView = ({showProgressIndicator}) => (
  <div className='kubernetes'>
    <div className={'progressIndicator ' + (showProgressIndicator ? '' : 'hidden')}>
      Loading...
    </div>

    <div className='tree'>
      <TreeNode resource={{
        kind: 'NamespaceList',
        metadata: {
          name: 'Namespaces',
        },
      }} />
    </div>
    <div className='editor'>
      <ResourceEditor />
    </div>
  </div>
)
KubernetesView.propTypes = {
  showProgressIndicator: PropTypes.bool,
}

export default KubernetesView
