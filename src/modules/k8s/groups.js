import { all, call, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  toKeysObject,
} from '../../utils';

import {
  PREFIX,
  ID,
  URL,
  RESOURCE_IDS,
  NO_GROUP,
  apiGet,
} from './shared';


// action codes
// --------------

export const GROUPS_GET = `${PREFIX}/GROUPS_GET`;
export const GROUPS_GET__S = `${PREFIX}/GROUPS_GET/S`;
export const GROUPS_GET__F = `${PREFIX}/GROUPS_GET/F`;


// action creators
// -----------------

export const groupsGet = () => ({
  type: GROUPS_GET,
});


// state
// -------

export function groupSelect(state, id) {
  return state[PREFIX].groups[id];
}

export const groupsState = {
  groups: {},
};


// saga
// ------

function* sagaGroupsGet() {
  yield takeEvery(GROUPS_GET, function* (action) {
    try {
      const { groups } = yield call(apiGet, '/apis');

      // add general api
      // as a fake group
      groups.push({
        name: NO_GROUP,
        preferredVersion: {
          groupVersion: '/api/v1',
          version: 'v1',
        },
        [URL]: '/api/v1',
      });

      // decorate
      const decorate = groupDecorate();
      groups.forEach(group => decorate(group));

      //
      yield put({
        type: GROUPS_GET__S,
        payload: { groups },
      });
    }

    catch (error) {
      yield put({
        type: GROUPS_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

export function* groupsSaga() {
  yield all([
    sagaGroupsGet(),
  ]);
}


// reducer
// ---------

export const groupsReducer = {

  [GROUPS_GET__S]: (state, action) => {
    const { groups } = action.payload;
    return update(state, {
      groups: { $set: toKeysObject(groups, ID) },
    });
  },
};


// helpers
//----------

function groupDecorate() {
  return group => {
    group[ID] = group.name;
    group[URL] = group[URL] || `/apis/${group.preferredVersion.groupVersion}`;
    group[RESOURCE_IDS] = [];
  };
}
