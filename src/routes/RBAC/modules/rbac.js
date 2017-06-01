// ------------------------------------
// Constants
// ------------------------------------

// ------------------------------------
// Actions
// ------------------------------------
export const actions = {
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const actionHandlers = {
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
}

export default function reducer (state = initialState, action) {
  const handler = actionHandlers[action.type]
  return handler ? handler(state, action) : state
}
