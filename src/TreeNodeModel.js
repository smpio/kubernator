class TreeNodeModel {
  static types = {
    root: 'root',
    resource: 'resource',
    kind: 'kind',
  }

  constructor(type, data, visibleName) {
    this.id = nextId++
    this.type = type
    this.data = data
    this.visibleName = visibleName
    this.childIds = []
    this.isOpened = false
    this.error = null
  }

  static fromResource(resource) {
    return new TreeNodeModel(TreeNodeModel.types.resource, resource, resource.metadata.name)
  }

  static fromKind(data, namespace) {
    data = {
      ...data,
      namespace: namespace,
    }
    return new TreeNodeModel(TreeNodeModel.types.kind, data, data.kind)
  }

  get shouldPrefetchChilds() {
    return this.type == TreeNodeModel.types.kind
  }

  get isEmpty() {
    return !this.shouldPrefetchChilds || this.childIds.length
  }
}

let nextId = 0
export default TreeNodeModel
