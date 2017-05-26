import React from 'react'
import PropTypes from 'prop-types'
import { fetchByKind, getResourceKindsPrioritized } from '../../../api'

export class TreeNode extends React.Component {
  static propTypes = {
    resource: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      visible: true
    }

    this.collapsed = props.collapsed || false
    this.updateState()

    if (this.collapsed && props.resource.kind == 'ResourceRoot') {
      this.state.visible = false
      this.getChilds().then(childs => {
        this.setState({
          visible: !!childs.length
        })
      })
    }
  }

  toggleCollapse = e => {
    this.collapsed = !this.collapsed
    this.updateState()
  }

  updateState() {
    let childs = Promise.resolve(null)
    if (!this.collapsed) {
      childs = this.getChilds()
    }

    childs.then(childs => {
      this.setState({
        childs: childs
      })
    })
  }

  getChilds() {
    let kind = this.props.resource.kind

    if (kind == 'NamespaceList') {
      return fetchByKind('Namespace').then(data => data.items)
    }
    else if (kind == 'Namespace') {
      return getResourceKindsPrioritized().then(resources => (
        resources.reduce((childs, resource) => {
          if (!resource.namespaced) return childs

          childs.push({
            kind: 'ResourceRoot',
            metadata: {
              name: resource.kind,
              namespace: this.props.resource.metadata.name,
            },
            resource: resource,
          })

          return childs
        }, [])
      ))
    }
    else if (kind == 'ResourceRoot') {
      let childKind = this.props.resource.metadata.name
      let childNamespace = this.props.resource.metadata.namespace
      return fetchByKind(childKind, childNamespace).then(data => data.items)
    }

    return Promise.resolve(null)
  }

  render() {
    const resource = this.props.resource
    const { childs, visible } = this.state

    return (
      <div className={visible ? '' : 'hidden'}>
        <div onClick={this.toggleCollapse}>{resource.metadata.name} {visible ? '' : 'HIDDEN'}</div>
        {childs && (
          <ul>
            {childs.map(child => (
              <li key={child.metadata.name}>
                <TreeNode resource={child} collapsed={true} />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}

export default TreeNode
