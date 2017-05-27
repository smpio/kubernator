import React from 'react'
import { fetchByKind } from '../../../api'
import TreeNode from '../containers/TreeNode'
import ResourceEditor from './ResourceEditor'
import './KubernetesView.scss'

class KubernetesView extends React.Component {
  render () {
    return (
      <div>
        <h4>Kubernetes</h4>
        <div className='kubernetes'>
          <div className='tree'>
            <TreeNode id={0} resource={{
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
      </div>
    )
  }
}

export default KubernetesView
