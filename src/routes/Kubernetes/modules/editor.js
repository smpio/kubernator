import {
  fetchResource,
  updateResource,
  createResource,
  getResourceKindsPrioritized
} from '../../../api'
import TreeNodeModel from '../../../TreeNodeModel'
import { copyResource } from '../../../introspection'
import yaml from 'js-yaml'


// ------------------------------------
// Constants
// ------------------------------------
export const SET_CHILDS = 'SET_CHILDS'
export const OPEN_NODE = 'OPEN_NODE'
export const CLOSE_NODE = 'CLOSE_NODE'
export const OPEN_RESOURCE = 'OPEN_RESOURCE'
export const DETACH_EDITOR = 'DETACH_EDITOR'
export const SET_RESOURCE_YAML = 'SET_RESOURCE_YAML'
export const START_USER_ACTION = 'START_USER_ACTION'
export const END_USER_ACTION = 'END_USER_ACTION'

// ------------------------------------
// Actions
// ------------------------------------
function userAction (thunkAction) {
  return (dispatch, ...otherArgs) => {
    dispatch(startUserAction())
    return thunkAction(dispatch, ...otherArgs)
      .then(result => {
        dispatch(endUserAction())
        return result
      }, error => {
        dispatch(endUserAction())
        throw error
      })
  }
}

export function clickTreeNode (node) {
  return userAction(dispatch => {
    let treePromise, editorPromise;

    if (!node.isOpened) {
      treePromise = openTreeNode(node, dispatch)
    } else {
      treePromise = closeTreeNode(node, dispatch)
    }

    if (node.type == TreeNodeModel.types.resource) {
      let resource = node.data

      editorPromise = fetchResource(resource.metadata.name, resource.kind, resource.metadata.namespace, {
        type: 'yaml',
      }).then(resourceYaml => dispatch({
        type: OPEN_RESOURCE,
        payload: {
          data: resource,
          yaml: resourceYaml,
        },
      }))
    } else {
      editorPromise = Promise.resolve()
    }

    return Promise.all([treePromise, editorPromise])
  })
}

function openTreeNode(node, dispatch) {
  return fetchChilds(node, dispatch).then(childs => {
    if (!childs) return childs

    childs.forEach(child => {
      if (child.shouldPrefetchChilds) {
        fetchChilds(child, dispatch)
      }
    })

    return dispatch({
      type: OPEN_NODE,
      nodeId: node.id,
    })
  })

  return result
}

function fetchChilds(node, dispatch) {
  let childs = null

  if (node.type == TreeNodeModel.types.root) childs = getRootNodeChilds(node)
  if (node.type == TreeNodeModel.types.resource) childs = getResourceNodeChilds(node)
  if (node.type == TreeNodeModel.types.kind) childs = getKindNodeChilds(node)

  if (childs) {
    return childs.then(childs => {
      if (childs) {
        dispatch({
          type: SET_CHILDS,
          parentId: node.id,
          childs: childs,
        })
      }

      return childs
    })
  }

  return Promise.resolve(null)
}

function closeTreeNode(node, dispatch) {
  return Promise.resolve(dispatch({
    type: CLOSE_NODE,
    nodeId: node.id,
  }))
}

function getRootNodeChilds (node) {
  return getResourceKindsPrioritized().then(resources => (
    resources.reduce((childs, resource) => {
      if (!resource.namespaced) {
        childs.push(TreeNodeModel.fromKind(resource))
      }
      return childs
    }, [])
  ))
}

function getResourceNodeChilds (node) {
  if (node.data.kind != 'Namespace') {
    return Promise.resolve(null)
  }

  return getResourceKindsPrioritized().then(resources => (
    resources.reduce((childs, resource) => {
      if (resource.namespaced) {
        childs.push(TreeNodeModel.fromKind(resource, node.data.metadata.name))
      }
      return childs
    }, [])
  ))
}

function getKindNodeChilds (node) {
  return fetchResource(null, node.data.kind, node.data.namespace).then((
    data => data.items.map(resource => (
      TreeNodeModel.fromResource(resource)
    )
  )))
}

export const saveResource = () => {
  return userAction((dispatch, getState) => {
    let {activeResource, activeResourceYaml} = getState().editor
    let promise;

    if (activeResource) {
      promise = updateResource(activeResource, activeResourceYaml, {
        type: 'yaml'
      })
    }
    else {
      let newResource = yaml.safeLoad(activeResourceYaml)
      promise = createResource(activeResourceYaml, newResource.kind, newResource.metadata.namespace, {
        type: 'yaml'
      })
    }

    return promise.then((newResourceYaml) => dispatch({
      type: OPEN_RESOURCE,
      payload: {
        data: activeResource,
        yaml: newResourceYaml,
      },
    }))
  })
}

export const detachEditor = () => {
  return userAction((dispatch, getState) => {
    let {activeResourceYaml} = getState().editor
    return copyResource(yaml.safeLoad(activeResourceYaml)).then(newResource => {
      let newResourceYaml = yaml.safeDump(newResource, {
        noRefs: true,
      })
      return dispatch({
        type: OPEN_RESOURCE,
        payload: {
          data: null,
          yaml: newResourceYaml,
        },
      })
    })
  })
}

export function setResourceYaml (value) {
  return {
    type: SET_RESOURCE_YAML,
    payload: value,
  }
}

export const startUserAction = () => {
  return {
    type: START_USER_ACTION,
  }
}

export const endUserAction = () => {
  return {
    type: END_USER_ACTION,
  }
}

export const actions = {
  clickTreeNode,
  saveResource,
  detachEditor,
  setResourceYaml,
  startUserAction,
  endUserAction,
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const globalActionHandlers = {
  [SET_CHILDS]: (state, action) => {
    const {parentId, childs} = action
    const parent = state.nodes[parentId]

    return {
      ...state,
      nodes: {
        ...state.nodes,
        ...childs.reduce((childMap, child) => {
          childMap[child.id] = child
          return childMap
        }, {}),
        [parentId]: Object.assign({__proto__: parent.__proto__}, parent, {
          childIds: childs.map(child => child.id),
        }),
      },
    }
  },

  [OPEN_NODE]: (state, action) => {
    const {nodeId} = action
    const node = state.nodes[nodeId]

    return {
      ...state,
      nodes: {
        ...state.nodes,
        [nodeId]: Object.assign({__proto__: node.__proto__}, node, {
          isOpened: true,
        }),
      },
    }
  },

  [CLOSE_NODE]: (state, action) => {
    const {nodeId} = action
    const childIds = getAllDescendantIds(nodeId, state.nodes)
    const node = state.nodes[nodeId]

    state = {
      ...state,
      nodes: {
        ...state.nodes,
        [nodeId]: Object.assign({__proto__: node.__proto__}, node, {
          isOpened: false,
        }),
      },
    }

    childIds.forEach(id => delete state.nodes[id])
    return state
  },

  [OPEN_RESOURCE]: (state, action) => ({
    ...state,
    activeResource: action.payload.data,
    activeResourceYaml: action.payload.yaml,
  }),

  [SET_RESOURCE_YAML]: (state, action) => ({
    ...state,
    activeResourceYaml: action.payload,
  }),

  [START_USER_ACTION]: state => ({
    ...state,
    activeUserActionsCount: state.activeUserActionsCount + 1,
  }),

  [END_USER_ACTION]: state => ({
    ...state,
    activeUserActionsCount: state.activeUserActionsCount > 0 ? state.activeUserActionsCount - 1 : 0,
  }),
}

const getAllDescendantIds = (nodeId, nodes) => {
  const node = nodes[nodeId]
  if (!node.isOpened) return []

  return node.childIds.reduce((acc, childId) => (
    [ ...acc, childId, ...getAllDescendantIds(childId, nodes) ]
  ), [])
}

// ------------------------------------
// Reducer
// ------------------------------------
const rootNode = new TreeNodeModel(TreeNodeModel.types.root, {}, 'Kubernetes Cluster')
const initialState = {
  rootNode: rootNode,
  nodes: {
    [rootNode.id]: rootNode,
  },
  activeResource: null,
  activeResourceYaml: '',
  activeUserActionsCount: 0,
}

export default function reducer (state = initialState, action) {
  const handler = globalActionHandlers[action.type]
  return handler ? handler(state, action) : state
}
