class TreeNodeModel {
  constructor(type, data, visibleName) {
    this.id = nextId++
    this.type = type
    this.data = data
    this.visibleName = visibleName
    this.childIds = []
    this.isOpened = false
    this.error = null
  }

  static fromObject(resource) {
    return new TreeNodeModel(TreeNodeModel.types.object, resource, resource.metadata.name)
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

TreeNodeModel.types = {
  root: 'root',
  object: 'object',
  kind: 'kind',
}

let nextId = 0
export default TreeNodeModel
