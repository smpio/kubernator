import { fetchResource, updateResource, createResource } from '../../../api'
import { copyResource } from '../../../introspection'
import yaml from 'js-yaml'

// ------------------------------------
// Constants
// ------------------------------------
export const OPEN_RESOURCE = 'OPEN_RESOURCE'
export const DETACH_EDITOR = 'DETACH_EDITOR'
export const SET_RESOURCE_YAML = 'SET_RESOURCE_YAML'

// ------------------------------------
// Actions
// ------------------------------------
export function openResource (resource) {
  return (dispatch) => {
    return fetchResource(resource.metadata.name, resource.kind, resource.metadata.namespace, {
      type: 'yaml',
    }).then(resourceYaml => dispatch({
      type: OPEN_RESOURCE,
      payload: {
        data: resource,
        yaml: resourceYaml,
      },
    }))
  }
}

export const saveResource = () => {
  return (dispatch, getState) => {
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
  }
}

export const detachEditor = () => {
  return (dispatch, getState) => {
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
  }
}

export function setResourceYaml (value) {
  return {
    type: SET_RESOURCE_YAML,
    payload: value,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const actionHandlers = {
  [OPEN_RESOURCE]: (state, action) => ({
    ...state,
    activeResource: action.payload.data,
    activeResourceYaml: action.payload.yaml,
  }),

  [SET_RESOURCE_YAML]: (state, action) => ({
    ...state,
    activeResourceYaml: action.payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  activeResource: null,
  activeResourceYaml: '',
}

export default function reducer (state = initialState, action) {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}
