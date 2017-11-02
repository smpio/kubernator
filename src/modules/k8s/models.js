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

      // get models
      let models;
      try { models = (yield call(cacheGet, `/swaggerapi${group[URL]}`)).models; }
      catch (error) {
        throw !(error instanceof NotiErrorApi) || error.code !== 404 ? error : {
          title: group.name,
          message: 'No swagger schemas provided. Removing readonly properties for items in this group won\'t work.',
        };
      }

      // process models
      const { version } = group.preferredVersion;
      models = Object.keys(models)
        .filter(key => key.startsWith(version))
        .map(key => {
          const [, kind] = key.split('.');
          const model = models[key];

          // set id
          delete model.id;
          model[ID] = kind;

          // rename refs
          const { properties } = model;
          Object.keys(properties).forEach(id => {
            const property = properties[id];
            const { $ref, description } = property;

            // rename ref
            if ($ref) property.$ref = $ref.split('.')[1];

            // set readonly flag
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
