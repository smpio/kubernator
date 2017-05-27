// ------------------------------------
// Constants
// ------------------------------------
export const OPEN_RESOURCE = 'OPEN_RESOURCE'

// ------------------------------------
// Actions
// ------------------------------------
export function openResource (resource) {
  return {
    type    : OPEN_RESOURCE,
    payload : resource,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const actionHandlers = {
  [OPEN_RESOURCE]: (state, action) => ({
    ...state,
    activeResource: action.payload,
  }),
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
