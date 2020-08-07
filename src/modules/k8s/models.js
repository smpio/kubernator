import { all, call } from 'redux-saga/effects';

import {
  NotiErrorApi,
} from '../../middleware/notifications';

import {
  PREFIX,
  ID,
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

export const modelsGet = () => ({
  type: MODELS_GET,
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
      // get models
      let models;
      try { models = yield call(cacheGet, '/openapi/v2'); }
      catch (e) {
        if (!(e instanceof NotiErrorApi && e.code === 404)) throw e;
        else {
          const error = new Error();
          error.title = 'OpenAPI';
          error.message = 'No OpenAPI schema. Removing readonly properties for items won\'t work.';
          throw error;
        }
      }

      // process models
      models.byGVK = {};
      Object.keys(models.definitions).forEach(key => {
        const def = models.definitions[key];
        def.$self = key;

        const gvks = def['x-kubernetes-group-version-kind'];
        if (gvks) {
          gvks.forEach(gvk => {
            const key = `${gvk.group || 'core'}/${gvk.version}/${gvk.kind}`;
            models.byGVK[key] = def;
            def[ID] = key;
          });
        }

        // set readonly flags
        if (def.properties) {
          Object.values(def.properties).forEach(prop => {
            prop[IS_READONLY] = prop.description && prop.description.includes('Read-only.');
          });
        }
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
    return {
      ...state,
      models: models,
    };
  },
};
