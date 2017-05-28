import { fetchResource, updateResource, createResource } from '../../../api'
import { copyResource } from '../../../introspection'
import yaml from 'js-yaml'


// ------------------------------------
// Constants
// ------------------------------------
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

export function openResource (resource) {
  return userAction((dispatch) => {
    return fetchResource(resource.metadata.name, resource.kind, resource.metadata.namespace, {
      type: 'yaml',
    }).then(resourceYaml => dispatch({
      type: OPEN_RESOURCE,
      payload: {
        data: resource,
        yaml: resourceYaml,
      },
    }))
  })
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
  openResource,
  saveResource,
  detachEditor,
  setResourceYaml,
  startUserAction,
  endUserAction,
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

  [START_USER_ACTION]: state => ({
    ...state,
    activeUserActionsCount: state.activeUserActionsCount + 1,
  }),

  [END_USER_ACTION]: state => ({
    ...state,
    activeUserActionsCount: state.activeUserActionsCount > 0 ? state.activeUserActionsCount - 1 : 0,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  activeResource: null,
  activeResourceYaml: '',
  activeUserActionsCount: 0,
}

export default function reducer (state = initialState, action) {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}
