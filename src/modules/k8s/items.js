import { all, call, put, select, takeEvery } from 'redux-saga/effects';
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

export const itemsGet = (resource, namespace, resolve, reject) => ({
  type: ITEMS_GET,
  payload: { resource, namespace: namespace || undefined, resolve, reject },
});

export const itemGet = id => ({
  type: ITEM_GET,
  payload: { id },
});

export const itemPost = (id, yaml) => ({
  type: ITEM_POST,
  payload: { id, yaml },
});

export const itemPut = (id, yaml) => ({
  type: ITEM_PUT,
  payload: { id, yaml },
});

export const itemDelete = id => ({
  type: ITEM_DELETE,
  payload: { id },
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
  yield takeEvery(ITEMS_GET, function* (action) {
    const { payload, meta } = action;
    const { resolve, reject } = payload;
    try {
      const { resource, namespace } = payload;

      // get
      const url = resourceGetUrl(resource, namespace);
      const { items } = yield call(apiFetch, url);

      // decorate
      const decorate = itemDecorate(resource);
      items.forEach(item => decorate(item));

      //
      yield put({
        type: ITEMS_GET__S,
        payload: { items },
        meta: { ...meta, resource, namespace },
      });

      //
      if (resolve) resolve();
    }

    catch (error) {

      //
      yield put({
        error: true,
        type: ITEMS_GET__F,
        payload: error,
        meta,
      });

      //
      if (reject) reject();
    }
  });
}

function* sagaItemGet() {
  yield takeEvery(ITEM_GET, function* (action) {
    const { payload, meta } = action;
    try {
      const { id } = payload;

      const item = yield select(itemSelect, id);
      if (item) {
        const yaml = yield call(itemApiGetYaml, item[URL]);
        yield put({
          type: ITEM_GET__S,
          payload: { yaml },
          meta: { ...meta, id },
        });
      }
    }

    catch (error) {
      yield put({
        error: true,
        type: ITEM_GET__F,
        payload: error,
        meta,
      });
    }
  });
}

function* sagaItemPost() {
  yield takeEvery(ITEM_POST, function* (action) {
    const { payload, meta } = action;
    try {
      let { id, yaml } = payload;

      // parse item
      const { kind } = jsYaml.safeLoad(yaml);
      if (!kind) throw new Error('Please, specify item\'s kind.');

      // find resource
      const resource = yield select(resourceSelectByKind, kind);
      if (!resource) throw new Error('Can\'t find correponding resource by kind.');

      // get url
      const { [URL]: url } = resource;

      // post
      const item = yield call(itemApiPost, url, yaml);
      if (item.status === 'Failure') throw item;

      // decorate item
      itemDecorate(resource)(item);

      //
      yield put({
        type: ITEM_POST__S,
        payload: { item },
        meta: { ...meta, resource },
      });

      // update tab
      yield put(tabClose(id));
      yield put(tabOpen(item[ID]));
    }

    catch (error) {
      yield put({
        error: true,
        type: ITEM_POST__F,
        payload: error,
        meta,
      });
    }
  });
}

function* sagaItemPut() {
  yield takeEvery(ITEM_PUT, function* (action) {
    const { payload, meta } = action;
    try {
      const { id, yaml } = payload;

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

      //
      yield put({
        type: ITEM_PUT__S,
        payload: { item },
        meta: { ...meta, id, yaml },
      });
    }

    catch (error) {
      yield put({
        error: true,
        type: ITEM_PUT__F,
        payload: error,
        meta,
      });
    }
  });
}

function* sagaItemDelete() {
  yield takeEvery(ITEM_DELETE, function* (action) {
    const { payload, meta } = action;
    try {
      const { id: itemId } = payload;

      //
      const {
        [URL]: itemUrl,
        [RESOURCE_ID]: resourceId,
      } = yield select(itemSelect, itemId);

      //
      const item = yield call(itemApiDelete, itemUrl);
      if (item.status === 'Failure') throw item;

      //
      yield put({
        type: ITEM_DELETE__S,
        meta: { ...meta, itemId, resourceId },
      });

      //
      yield put(tabClose(itemId));
    }

    catch (error) {
      yield put({
        error: true,
        type: ITEM_DELETE__F,
        payload: error,
        meta,
      });
    }
  });
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

export const itemsReducer = {

  [ITEMS_GET__S]: (state, action) => {
    const { items } = action.payload;
    const { resource, namespace } = action.meta;

    // merge items
    const idsNew = toKeysArray(items, ID);
    const idsMerge = idsOld => {
      const { items } = state;
      return idsOld
        .filter(id => items[id].metadata.namespace !== namespace)
        .concat(idsNew);
    };

    //
    return update(state, {
      resources: {
        [resource[ID]]: {
          [ITEM_IDS]: { $apply: idsMerge },
        },
      },
      items: { $merge: toKeysObject(items, ID) },
    });
  },

  [ITEM_GET__S]: (state, action) => {
    const { id } = action.meta;
    const { yaml } = action.payload;
    return update(state, {
      items: {
        [id]: {
          $merge: {
            [YAML]: yaml,
          },
        },
      },
    });
  },

  [ITEM_POST__S]: (state, action) => {
    const { resource: { [ID]: resourceId }} = action.meta;
    const { item, item: { [ID]: itemId }} = action.payload;

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

  [ITEM_PUT__S]: (state, action) => {
    const { id, yaml } = action.meta;
    const { item } = action.payload;
    return update(state, {
      items: {
        [id]: {
          $set: {
            ...item,
            [YAML]: yaml,
          },
        },
      },
    });
  },

  [ITEM_DELETE__S]: (state, action) => {
    const { itemId, resourceId } = action.meta;
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

export function itemRemoveReadonlyProperties(models, item, modelId) {
  if (item) {
    const model = models[modelId];
    if (model) {
      const { properties } = model;
      Object.keys(properties).forEach(key => {
        const { [IS_READONLY]: readonly, $ref } = properties[key];
        if (readonly) delete item[key];
        else if ($ref) itemRemoveReadonlyProperties(models, item[key], $ref);
      });
    }
  }
}
