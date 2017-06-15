import { delay } from 'redux-saga'
import { put, call, takeEvery } from 'redux-saga/effects'

// action codes
// --------------

const PREFIX = 'counter'
export const INCREMENT = `${PREFIX}/INCREMENT`
export const INCREMENT_ASYNC = `${PREFIX}/INCREMENT_ASYNC`

// action creators
// -----------------

export const increment = () =>
  ({ type: INCREMENT })

export const incrementAsync = () =>
  ({ type: INCREMENT_ASYNC })

// sagas
// -------

export function * saga () {
  yield takeEvery(INCREMENT_ASYNC, function * () {
    yield call(delay, 1000)
    yield put(increment())
  })
}

// reducers
// ----------

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
