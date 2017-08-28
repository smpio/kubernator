import { all, call, put, select } from 'redux-saga/effects';
import update from 'immutability-helper';
import jsYaml from 'js-yaml';

import {
  toKeysObject,
  toKeysArray,
} from '../../utils';

import {
  PREFIX,
  ID,
  URL,
  YAML,
  RESOURCE_ID,
  ITEM_IDS,
  IS_READONLY,
  NO_UID,
  apiFetch,
  apiFlagsSet,
  apiFlagsUnset,
  takeEveryReq,
} from './shared';

import {
  resourceGetUrl,
  resourceSelect,
  resourceSelectByKind,
} from './resources';

import {
  tabOpen,
  tabClose,
} from './tabs';


// action codes
// --------------

export const ITEMS_GET = `${PREFIX}/ITEMS_GET`;
export const ITEMS_GET__S = `${PREFIX}/ITEMS_GET/S`;
export const ITEMS_GET__F = `${PREFIX}/ITEMS_GET/F`;

export const ITEM_GET = `${PREFIX}/ITEM_GET`;
export const ITEM_GET__S = `${PREFIX}/ITEM_GET/S`;
export const ITEM_GET__F = `${PREFIX}/ITEM_GET/F`;

export const ITEM_POST = `${PREFIX}/ITEM_POST`;
export const ITEM_POST__S = `${PREFIX}/ITEM_POST/S`;
export const ITEM_POST__F = `${PREFIX}/ITEM_POST/F`;

export const ITEM_PUT = `${PREFIX}/ITEM_PUT`;
export const ITEM_PUT__S = `${PREFIX}/ITEM_PUT/S`;
export const ITEM_PUT__F = `${PREFIX}/ITEM_PUT/F`;

export const ITEM_DELETE = `${PREFIX}/ITEM_DELETE`;
export const ITEM_DELETE__S = `${PREFIX}/ITEM_DELETE/S`;
export const ITEM_DELETE__F = `${PREFIX}/ITEM_DELETE/F`;


// action creators
// -----------------

export const itemsGet = (resource, namespace, _resolve, _reject) => ({
  type: ITEMS_GET,
  payload: { resource, namespace: namespace || undefined },
  promise: { _resolve, _reject },
});

export const itemGet = (id, _resolve, _reject) => ({
  type: ITEM_GET,
  payload: { id },
  promise: { _resolve, _reject },
});

export const itemPost = (id, yaml, _resolve, _reject) => ({
  type: ITEM_POST,
  payload: { id, yaml },
  promise: { _resolve, _reject },
});

export const itemPut = (id, yaml, _resolve, _reject) => ({
  type: ITEM_PUT,
  payload: { id, yaml },
  promise: { _resolve, _reject },
});

export const itemDelete = (id, _resolve, _reject) => ({
  type: ITEM_DELETE,
  payload: { id },
  promise: { _resolve, _reject },
});


// api
// ------

function itemApiGetYaml(url) {
  return apiFetch(
    url,
    {
      headers: {
        'Accept': 'application/yaml',
      },
    },
    'text',
  );
}

function itemApiPost(url, yaml) {
  return apiFetch(
    url,
    {
      method: 'POST',
      body: yaml,
      headers: {
        'Content-Type': 'application/yaml',
      },
    },
  );
}

function itemApiPut(url, yaml) {
  return apiFetch(
    url,
    {
      method: 'PUT',
      body: yaml,
      headers: {
        'Content-Type': 'application/yaml',
      },
    },
  );
}

function itemApiDelete(url) {
  return apiFetch(
    url,
    {
      method: 'DELETE',
    },
  );
}


// state
// ---------

export function itemSelect(state, id) {
  return state[PREFIX].items[id];
}

export const itemsState = {
  items: {},
};


// saga
// ------

function* sagaItemsGet() {
  yield takeEveryReq(
    [
      ITEMS_GET,
      ITEMS_GET__S,
      ITEMS_GET__F,
    ],
    function* (action) {
      const { resource, namespace } = action.payload;

      // get
      const url = resourceGetUrl(resource, namespace);
      const { items } = yield call(apiFetch, url);

      // decorate
      const decorate = itemDecorate(resource);
      items.forEach(item => decorate(item));

      //
      return { resource, namespace, items };
    },
  );
}

function* sagaItemGet() {
  yield takeEveryReq(
    [
      ITEM_GET,
      ITEM_GET__S,
      ITEM_GET__F,
    ],
    function* (action) {
      const { id } = action.payload;
      const item = yield select(itemSelect, id);
      if (!item) return null;
      else {
        const yaml = yield call(itemApiGetYaml, item[URL]);
        return { id, yaml };
      }
    },
  );
}

function* sagaItemPost() {
  yield takeEveryReq(
    [
      ITEM_POST,
      ITEM_POST__S,
      ITEM_POST__F,
    ],
    function* (action) {
      let { id, yaml } = action.payload;

      // parse item
      const { kind, metadata: { namespace } = {}} = jsYaml.safeLoad(yaml);
      if (!kind) throw new Error('Please, specify item\'s kind.');

      // find resource
      const resource = yield select(resourceSelectByKind, kind);
      if (!resource) throw new Error('Can\'t find correponding resource by kind.');

      // get url
      const { namespaced, [URL]: resourceUrl } = resource;
      const url = namespaced ? resourceGetUrl(resource, namespace) : resourceUrl;

      // post
      const item = yield call(itemApiPost, url, yaml);
      if (item.status === 'Failure') throw item;

      // decorate item
      itemDecorate(resource)(item);

      //
      return { id, resource, item };
    },
    function* (payload) {
      const { id, item } = payload;
      yield put(tabClose(id));
      yield put(tabOpen(item[ID]));
    },
  );
}

function* sagaItemPut() {
  yield takeEveryReq(
    [
      ITEM_PUT,
      ITEM_PUT__S,
      ITEM_PUT__F,
    ],
    function* (action) {
      const { id } = action.payload;
      let { yaml } = action.payload;

      //
      const {
        [URL]: url,
        [RESOURCE_ID]: resourceId,
      } = yield select(itemSelect, id);
      const resource = yield select(resourceSelect, resourceId);

      // put
      const item = yield call(itemApiPut, url, yaml);
      if (item.status === 'Failure') throw item;

      // decorate item
      itemDecorate(resource)(item);

      // sync yaml
      yaml = yield call(itemApiGetYaml, url);

      //
      return { id, item, yaml };
    },
  );
}

function* sagaItemDelete() {
  yield takeEveryReq(
    [
      ITEM_DELETE,
      ITEM_DELETE__S,
      ITEM_DELETE__F,
    ],
    function* (action) {
      const { id: itemId } = action.payload;

      //
      const {
        [URL]: itemUrl,
        [RESOURCE_ID]: resourceId,
      } = yield select(itemSelect, itemId);

      //
      const item = yield call(itemApiDelete, itemUrl);
      if (item.status === 'Failure') throw item;

      //
      return { itemId, resourceId };
    },
    function* (payload) {
      const { itemId } = payload;
      yield put(tabClose(itemId));
    },
  );
}

export function* itemsSaga() {
  yield all([
    sagaItemsGet(),
    sagaItemGet(),
    sagaItemPost(),
    sagaItemPut(),
    sagaItemDelete(),
  ]);
}


// reducer
// ---------

function itemFlags(state, action) {
  const { payload: { id }} = action;
  const { items: { [id]: item }} = state;
  const flags = apiFlagsSet(state, action);
  return !item ? state : update(state, {
    items: {
      [id]: { $merge: flags },
    },
  });
}

export const itemsReducer = {

  [ITEMS_GET__S]: (state, action) => {
    const { resource, namespace, items } = action.payload;

    // merge item ids
    // replace only items belonging to the specified namespace
    const idsNew = toKeysArray(items, ID);
    const idsMerge = idsOld => {
      const { items } = state;
      return idsOld
        .filter(id => items[id].metadata.namespace !== namespace)
        .concat(idsNew);
    };

    // merge items
    // copy loaded YAML values from old items
    const itemsMerge = itemsOld => {
      const itemsNew = items;

      itemsNew.forEach(itemNew => {
        const itemOld = itemsOld[itemNew[ID]];
        if (itemOld && itemOld[YAML]) itemNew[YAML] = itemOld[YAML];
      });

      return {
        ...itemsOld,
        ...toKeysObject(itemsNew, ID),
      };
    };

    //
    return update(state, {
      resources: {
        [resource[ID]]: {
          [ITEM_IDS]: { $apply: idsMerge },
        },
      },
      items: { $apply: itemsMerge },
    });
  },

  [ITEM_GET]: itemFlags,
  [ITEM_GET__F]: itemFlags,
  [ITEM_GET__S]: (state, action) => {
    const { id, yaml } = action.payload;
    return update(state, {
      items: {
        [id]: {
          $merge: {
            ...apiFlagsUnset,
            [YAML]: yaml,
          },
        },
      },
    });
  },

  [ITEM_POST]: itemFlags,
  [ITEM_POST__F]: itemFlags,
  [ITEM_POST__S]: (state, action) => {
    const {
      resource: { [ID]: resourceId },
      item, item: { [ID]: itemId },
    } = action.payload;

    return update(state, {
      resources: {
        [resourceId]: {
          [ITEM_IDS]: { $push: [itemId] },
        },
      },
      items: {
        [itemId]: { $set: item },
      },
    });
  },

  [ITEM_PUT]: itemFlags,
  [ITEM_PUT__F]: itemFlags,
  [ITEM_PUT__S]: (state, action) => {
    const { id, item, yaml } = action.payload;
    return update(state, {
      items: {
        [id]: {
          $set: {
            ...item,
            ...apiFlagsUnset,
            [YAML]: yaml,
          },
        },
      },
    });
  },

  [ITEM_DELETE]: itemFlags,
  [ITEM_DELETE__F]: itemFlags,
  [ITEM_DELETE__S]: (state, action) => {
    const { itemId, resourceId } = action.payload;
    return update(state, {
      resources: {
        [resourceId]: {
          [ITEM_IDS]: { $pop: [itemId] },
        },
      },
      items: { $del: [itemId] },
    });
  },
};


// helpers
// ---------

export function itemDecorate(resource) {
  const { [ID]: resourceId } = resource;
  return item => {
    const { uid, name, namespace } = item.metadata;
    const resourceUrl = resourceGetUrl(resource, namespace);
    item[RESOURCE_ID] = resourceId;
    item[ID] = uid || `${NO_UID}-${name}`;
    item[URL] = `${resourceUrl}/${name}`;
  };
}

export function itemRemoveReadonlyProperties(item, models, modelId, forcedKeys) {
  if (item) {

    // remove forced keys
    forcedKeys && forcedKeys.forEach(key => delete item[key]);

    // remove readonly keys
    const model = models[modelId];
    if (model) {
      const { properties } = model;
      Object.keys(properties).forEach(key => {
        const { [IS_READONLY]: readonly, $ref } = properties[key];
        if (readonly) delete item[key];
        else if ($ref) itemRemoveReadonlyProperties(item[key], models, $ref);
      });
    }
  }
}
