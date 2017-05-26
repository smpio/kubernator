import React from 'react'
import { fetchByKind } from '../../../api'
import TreeNode from '../containers/TreeNode'
import './KubernetesView.scss'

class KubernetesView extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    fetchByKind('Deployment', 'ceph').then(namespaces => {
      this.setState({
        data: namespaces
      })
    })
  }

  render () {
    return (
      <div>
        <h4>Kubernetes</h4>
        <div className='kubernetes'>
          { /* <pre>{JSON.stringify(this.state.data, null, 2)}</pre> */ }
          <TreeNode id={0} resource={{
            kind: 'NamespaceList',
            metadata: {
              name: 'Namespaces',
            },
          }} />
        </div>
      </div>
    )
  }
}

export default KubernetesView
