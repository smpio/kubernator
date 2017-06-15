import {
  fetchObject,
  updateObject,
  createObject,
  deleteObject,
  fetchObjectsByKind,
  getResourcesPrioritized,
} from './api'
import TreeNode from './TreeNode'
import { copyObject } from './introspection'
import yaml from 'js-yaml'
import React from 'react'


// ------------------------------------
// Constants
// ------------------------------------
export const SET_CHILDS = 'SET_CHILDS'
export const OPEN_NODE = 'OPEN_NODE'
export const CLOSE_NODE = 'CLOSE_NODE'
export const SET_NODE_ERROR = 'SET_NODE_ERROR'
export const OPEN_OBJECT = 'OPEN_OBJECT'
export const DETACH_EDITOR = 'DETACH_EDITOR'
export const DELETE_OBJECT = 'DELETE_OBJECT'
export const SET_OBJECT_YAML = 'SET_OBJECT_YAML'
export const START_USER_ACTION = 'START_USER_ACTION'
export const END_USER_ACTION = 'END_USER_ACTION'

// ------------------------------------
// Actions
// ------------------------------------
function userAction (thunkAction) {
  return (dispatch, getState, extra) => {
    dispatch(startUserAction())
    return thunkAction(dispatch, getState, extra)
      .then(result => {
        dispatch(endUserAction())
        return result
      }, error => {
        dispatch(endUserAction())
        dispatch({
          type: 'kubernetes/ERROR',
          error: true,
          payload: {
            message: error instanceof Response
              ? error.data.toString()
              : error.toString(),
          },
        })
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

    if (node.type == TreeNode.types.object) {
      let obj = node.data

      editorPromise = fetchObject(obj.metadata.name, obj.kind, obj.metadata.namespace, {
        type: 'yaml',
      }).then(objYaml => dispatch({
        type: OPEN_OBJECT,
        object: obj,
        yaml: objYaml,
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
}

function fetchChilds(node, dispatch) {
  let childs = null

  if (node.type == TreeNode.types.root) childs = getRootNodeChilds(node)
  if (node.type == TreeNode.types.object) childs = getObjectNodeChilds(node)
  if (node.type == TreeNode.types.kind) childs = getKindNodeChilds(node)

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
    }, error => {
      let details = null
      if (error instanceof Response) {
        details = error.data
      }

      dispatch({
        type: SET_NODE_ERROR,
        nodeId: node.id,
        error: details || error,
      })

      if (!details) {
        throw error
      }
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
  return getResourcesPrioritized().then(resources => (
    resources.reduce((childs, resource) => {
      if (!resource.namespaced) {
        childs.push(TreeNode.fromKind(resource))
      }
      return childs
    }, [])
  ))
}

function getObjectNodeChilds (node) {
  if (node.data.kind != 'Namespace') {
    return Promise.resolve(null)
  }

  return getResourcesPrioritized().then(resources => (
    resources.reduce((childs, resource) => {
      if (resource.namespaced) {
        childs.push(TreeNode.fromKind(resource, node.data.metadata.name))
      }
      return childs
    }, [])
  ))
}

function getKindNodeChilds (node) {
  return fetchObjectsByKind(node.data.kind, node.data.namespace).then((
    data => data.items.map(obj => TreeNode.fromObject(obj)
  )))
}

export const saveObject = () => {
  return userAction((dispatch, getState) => {
    let {activeObject, activeObjectYaml} = getState().editor
    let promise;

    if (activeObject) {
      promise = updateObject(activeObject, activeObjectYaml, {
        type: 'yaml'
      })
    }
    else {
      let newObj = yaml.safeLoad(activeObjectYaml)
      if (!newObj || !newObj.kind || !newObj.metadata) {
        return Promise.reject(new Error('Invalid object "' + newObj + '"'))
      }
      promise = createObject(activeObjectYaml, newObj.kind, newObj.metadata.namespace, {
        type: 'yaml'
      })
    }

    return promise.then(newObjYaml => dispatch({
      type: OPEN_OBJECT,
      object: activeObject,
      yaml: newObjYaml,
    }))
  })
}

export const detachEditor = () => {
  return userAction((dispatch, getState) => {
    let {activeObjectYaml} = getState().editor
    return copyObject(yaml.safeLoad(activeObjectYaml)).then(newObj => {
      let newObjYaml = yaml.safeDump(newObj, {
        noRefs: true,
      })
      return dispatch({
        type: OPEN_OBJECT,
        object: null,
        yaml: newObjYaml,
      })
    })
  })
}

export const deleteActiveObject = () => {
  //if (!confirm('Really delete?')) return

  return userAction((dispatch, getState) => {
    let {activeObject} = getState().editor
    if (!activeObject) return Promise.reject(new Error('No active object'))

    return deleteObject(activeObject).then(() => dispatch(detachEditor()))
  })
}

export function setObjectYaml (value) {
  return {
    type: SET_OBJECT_YAML,
    yaml: value,
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

  [SET_NODE_ERROR]: (state, action) => {
    const {nodeId} = action
    const node = state.nodes[nodeId]

    return {
      ...state,
      nodes: {
        ...state.nodes,
        [nodeId]: Object.assign({__proto__: node.__proto__}, node, {
          error: action.error,
        }),
      },
    }
  },

  [OPEN_OBJECT]: (state, action) => ({
    ...state,
    activeObject: action.object,
    activeObjectYaml: action.yaml,
  }),

  [SET_OBJECT_YAML]: (state, action) => ({
    ...state,
    activeObjectYaml: action.yaml,
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
const rootNode = new TreeNode(TreeNode.types.root, {}, 'Kubernetes Cluster')
const initialState = {
  rootNode: rootNode,
  nodes: {
    [rootNode.id]: rootNode,
  },
  activeObject: null,
  activeObjectYaml: '',
  activeUserActionsCount: 0,
}

export default function reducer (state = initialState, action) {
  const handler = globalActionHandlers[action.type]
  return handler ? handler(state, action) : state
}
