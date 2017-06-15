import { delay } from 'redux-saga'
import { put, takeEvery } from 'redux-saga/effects'

import {
  INCREMENT_ASYNC,
  increment,
} from '../modules/counter'

export function * _incrementAsync () {
  yield delay(1000)
  yield put(increment())
}

export default function * _watchIncrementAsync () {
  yield takeEvery(INCREMENT_ASYNC, _incrementAsync)
}
