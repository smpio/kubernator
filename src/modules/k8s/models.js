import { all, call } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  NotiErrorApi,
} from '../../middleware/notifications';

import {
  toKeysObject,
} from '../../utils';

import {
  PREFIX,
  ID,
  URL,
  IS_READONLY,
  cacheGet,
  takeEveryReq,
} from './shared';


// action codes
// --------------

export const MODELS_GET = `${PREFIX}/MODELS_GET`;
export const MODELS_GET__S = `${PREFIX}/MODELS_GET/S`;
export const MODELS_GET__F = `${PREFIX}/MODELS_GET/F`;


// action creators
// -----------------

export const modelsGet = group => ({
  type: MODELS_GET,
  payload: { group },
});


// state
// ---------

export function modelsSelect(state) {
  return state[PREFIX].models;
}

export const modelsState = {
  models: {},
};


// saga
// ------

function* sagaModelsGet() {
  yield takeEveryReq(
    [
      MODELS_GET,
      MODELS_GET__S,
      MODELS_GET__F,
    ],
    function* (action) {
      const { group } = action.payload;

      //
      const {
        [URL]: groupUrl,
        name: groupName,
      } = group;

      // get models
      let models;
      try { models = (yield call(cacheGet, `/swaggerapi${groupUrl}`)).models; }
      catch (e) {
        if (!(e instanceof NotiErrorApi && e.code === 404)) throw e;
        else {
          const error = new Error();
          error.title = groupName;
          error.message = 'No swagger schemas provided. Removing readonly properties for items in this group won\'t work.';
          throw error;
        }
      }

      // process models
      models = Object.keys(models).map(key => {
        const model = models[key];

        // set id
        delete model.id;
        model[ID] = key;

        // set readonly flags
        const { properties } = model;
        Object.keys(properties).forEach(id => {
          const property = properties[id];
          const { description } = property;
          property[IS_READONLY] = description && description.includes('Read-only.');
        });

        //
        return model;
      });

      //
      return { models };
    },
  );
}

export function* modelsSaga() {
  yield all([
    sagaModelsGet(),
  ]);
}


// reducer
// ---------

export const modelsReducer = {

  [MODELS_GET__S]: (state, action) => {
    const { models } = action.payload;
    return update(state, {
      models: { $merge: toKeysObject(models, ID) },
    });
  },
};
