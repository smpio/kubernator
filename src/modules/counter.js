const PREFIX = 'counter'
export const INCREMENT = `${PREFIX}/INCREMENT`
export const INCREMENT_ASYNC = `${PREFIX}/INCREMENT_ASYNC`

const initialState = {
  count: 0,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case INCREMENT:
      return {
        ...state,
        count: state.count + 1,
      }

    default:
      return state
  }
}

export const increment = () =>
  ({ type: INCREMENT })

export const incrementAsync = () =>
  ({ type: INCREMENT_ASYNC })
