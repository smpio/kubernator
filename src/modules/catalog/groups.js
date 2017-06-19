import { put, call, takeEvery, all } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  PREFIX,
  URL,
  KINDS,
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


// saga
// ------

async function groupsFetch() {
  const res = await fetch('/apis');
  return res.json();
}

function* groupsGetSaga() {
  yield takeEvery(GROUPS_GET, function* () {
    try {
      const { groups } = yield call(groupsFetch);
      yield put({
        type: GROUPS_GET__S,
        payload: { groups },
      });
    } catch (error) {
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
    groupsGetSaga(),
  ]);
}


// reducer
// ---------

export const groupsState = {
  groups: {
    /* groupName: groupObject */
  },
};

export const groupsReducer = {

  [GROUPS_GET__S]: (state, action) => {
    const { groups } = action.payload;

    // add URL and kinds to all received groups
    groups.forEach(group => {
      group[URL] = `/apis/${group.preferredVersion.groupVersion}`;
      group[KINDS] = {};
    });

    // add a fake general group
    groups.push({
      name: '[nogroup]',
      [URL]: '/api/v1',
      [KINDS]: {},
    });

    // save by name
    const names = groups.reduce(
      (names, group) => {
        names[group.name] = group;
        return names;
      },
      {},
    );

    //
    return update(state, {
      groups: { $merge: names },
    });
  },
};
