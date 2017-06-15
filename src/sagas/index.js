import { all } from 'redux-saga/effects'

import counter from './counter'

export default function * () {
  yield all([
    counter(),
  ])
}
