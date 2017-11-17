import { all, call, put } from 'redux-saga/effects';
import update from 'immutability-helper';
import store from 'store';

import appInfo from '../../../package.json';

import {
  PREFIX,
  apiFetch,
  takeEveryReq,
} from './shared';


// action codes
// --------------

export const BASIC_INFO_GET = `${PREFIX}/BASIC_INFO_GET`;
export const BASIC_INFO_GET__S = `${PREFIX}/BASIC_INFO_GET/S`;
export const BASIC_INFO_GET__F = `${PREFIX}/BASIC_INFO_GET/F`;


// action creators
// -----------------

export const basicInfoGet = () => ({
  type: BASIC_INFO_GET,
});


// state
// -------

export const basicState = {
  basic: {},
};


// saga
// ------

function* sagaBasicInfoGet() {
  yield takeEveryReq(
    [
      BASIC_INFO_GET,
      BASIC_INFO_GET__S,
      BASIC_INFO_GET__F,
    ],
    function* (action) {

      // legacy
      const legacy = 'version.gitVersion';
      if (store.get(legacy)) store.remove(legacy);

      // api
      const apiInfo = yield call(apiFetch, '/version');
      const { gitVersion: apiVersionNew } = apiInfo;
      const { gitVersion: apiVersionOld } = store.get('apiInfo') || {};
      if (apiVersionNew !== apiVersionOld) {
        store.clearAll();
        store.set('apiInfo', apiInfo);
      }

      // app
      const { version: appVersionNew } = appInfo;
      const { version: appVersionOld } = store.get('appInfo') || {};
      if (appVersionNew !== appVersionOld) {
        store.set('appInfo', appInfo);
      }

      //
      return { appInfo, apiInfo };
    },
  );
}

function* sagaBasicInit() {

  yield put(basicInfoGet());
}

export function* basicSaga() {
  yield all([
    sagaBasicInfoGet(),
    sagaBasicInit(),
  ]);
}


// reducer
// ---------

export const basicReducer = {

  [BASIC_INFO_GET__S]: (state, action) => {
    const { appInfo, apiInfo } = action.payload;
    return update(state, {
      basic: {
        appInfo: { $set: appInfo },
        apiInfo: { $set: apiInfo },
      },
    });
  },
};
