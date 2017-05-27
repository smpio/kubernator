import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { openResource } from '../modules/editor'
import { fetchByKind, getResourceKindsPrioritized } from '../../../api'
import './TreeNode.scss'


export class TreeNode extends React.Component {
  static propTypes = {
    resource: PropTypes.object.isRequired,
    openResource: PropTypes.func.isRequired,
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

  onClick = e => {
    this.toggleCollapse()
    this.props.openResource(this.props.resource)
  }

  toggleCollapse() {
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
        <div onClick={this.onClick}>{resource.metadata.name}</div>
        {childs && (
          <ul>
            {childs.map(child => (
              <li key={child.metadata.name}>
                <TreeNodeContainer resource={child} collapsed={true} />
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}

const mapDispatchToProps = {
  openResource,
}

const mapStateToProps = (state) => ({
})

export const TreeNodeContainer = connect(mapStateToProps, mapDispatchToProps)(TreeNode)
export default TreeNodeContainer
