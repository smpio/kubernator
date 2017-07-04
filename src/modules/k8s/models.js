import { all, call, put, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';

import {
  toKeysObject,
} from '../../utils';

import {
  PREFIX,
  ID,
  URL,
  IS_READONLY,
  apiGet,
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
  yield takeEvery(MODELS_GET, function* (action) {
    try {
      const { payload, meta } = action;
      const { group } = payload;

      // models
      let { models } = yield call(apiGet, `/swaggerapi${group[URL]}`);
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
      yield put({
        type: MODELS_GET__S,
        payload: { models },
        meta,
      });
    }

    catch (error) {
      yield put({
        type: MODELS_GET__F,
        payload: error,
        error: true,
      });
    }
  });
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
