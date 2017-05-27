import React from 'react'
import TreeNode from '../containers/TreeNodeContainer'
import ResourceEditor from '../containers/ResourceEditorContainer'
import './KubernetesView.scss'


export const KubernetesView = () => (
  <div className='kubernetes'>
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

export default KubernetesView
