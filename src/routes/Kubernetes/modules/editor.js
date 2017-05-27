import { fetchResource } from '../../../api'

// ------------------------------------
// Constants
// ------------------------------------
export const OPEN_RESOURCE = 'OPEN_RESOURCE'

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

// ------------------------------------
// Action Handlers
// ------------------------------------
const actionHandlers = {
  [OPEN_RESOURCE]: (state, action) => ({
    ...state,
    activeResource: action.payload.data,
    activeResourceYaml: action.payload.yaml,
  })
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  activeResource: null,
}

export default function reducer (state = initialState, action) {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}
