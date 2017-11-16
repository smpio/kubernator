import { all, call, select } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  toKeysObject,
  selectArr,
} from '../../utils';

import {
  PREFIX,
  ID,
  URL,
  VERSIONS,
  RESOURCE_IDS,
  NO_GROUP,
  cacheGet,
  putTake,
  takeEveryReq,
} from './shared';


// action codes
// --------------

export const GROUPS_GET = `${PREFIX}/GROUPS_GET`;
export const GROUPS_GET__S = `${PREFIX}/GROUPS_GET/S`;
export const GROUPS_GET__F = `${PREFIX}/GROUPS_GET/F`;

export const GROUP_GET = `${PREFIX}/GROUP_GET`;
export const GROUP_GET__S = `${PREFIX}/GROUP_GET/S`;
export const GROUP_GET__F = `${PREFIX}/GROUP_GET/F`;


// action creators
// -----------------

export const groupsGet = () => ({
  type: GROUPS_GET,
});

export const groupGet = id => ({
  type: GROUP_GET,
  payload: { id },
});


// state
// -------

export function groupsSelectArr(state) {
  return selectArr(state[PREFIX].groups);
}

export function groupSelect(state, id) {
  return state[PREFIX].groups[id];
}

export const groupsState = {
  groups: {},
};


// saga
// ------

function* sagaGroupsGet() {
  yield takeEveryReq(
    [
      GROUPS_GET,
      GROUPS_GET__S,
      GROUPS_GET__F,
    ],
    function* (action) {

      // get
      const { groups } = yield call(cacheGet, '/apis');

      // add general api
      // as a fake group
      groups.push({
        name: NO_GROUP,
        versions: [{ version: 'v1' }],
        preferredVersion: { version: 'v1' },
      });

      // decorate
      const decorate = groupDecorate();
      groups.forEach(decorate);

      //
      return { groups };
    },
  );
}

function* sagaGroupGet() {
  yield takeEveryReq(
    [
      GROUP_GET,
      GROUP_GET__S,
      GROUP_GET__F,
    ],
    function* (action) {
      const { id } = action.payload;

      const group =
        (yield putTake(groupsGet(), [GROUPS_GET__S, GROUPS_GET__F])) &&
        (yield select(groupSelect, id));

      //
      return { group };
    },
  );
}

export function* groupsSaga() {
  yield all([
    sagaGroupsGet(),
    sagaGroupGet(),
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
    const { name, versions = [] } = group;
    group[ID] = name;
    group[URL] = name === NO_GROUP ? '/api' : `/apis/${name}`; // + '/' + version
    group[VERSIONS] = versions.map(v => v.version);
    group[RESOURCE_IDS] = [];
  };
}

export function groupGetUrl(group, version) {
  const { preferredVersion, [URL]: groupUrl } = group;
  return `${groupUrl}/${version || preferredVersion.version}`;
}
