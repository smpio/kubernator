import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import update from 'immutability-helper';
import jsYaml from 'js-yaml';

import {
  PREFIX,
  RESOURCE,
  ITEMS,
  YAML,
  ID,
  URL,
  URL_PART_GROUP,
  URL_PART_RESOURCE,
} from './shared';

import {
  tabOpen,
  tabClose,
} from './tabs';

import {
  decorateItem,
} from './tree';


// action codes
// --------------

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
// -----

async function apiItemGetYaml(url) {
  const res = await fetch(
    url,
    {
      headers: {
        'Accept': 'application/yaml',
      },
    },
  );
  return res.text();
}

async function apiItemPost(url, yaml) {
  const res = await fetch(
    url,
    {
      method: 'POST',
      body: yaml,
      headers: {
        'Content-Type': 'application/yaml',
      },
    },
  );
  return res.json();
}

async function apiItemPut(url, yaml) {
  const res = await fetch(
    url,
    {
      method: 'PUT',
      body: yaml,
      headers: {
        'Content-Type': 'application/yaml',
      },
    },
  );
  return res.json();
}

async function apiItemDelete(url) {
  const res = await fetch(
    url,
    {
      method: 'DELETE',
    },
  );
  return res.json();
}


// state
// -------

export function stateItemGet(state, id) {
  return state[PREFIX].items[id];
}

function stateResourceGetByKind(state, kind) {
  const { resources } = state[PREFIX];

  // find correponding resources
  const resourceIds = Object.keys(resources)
    .filter(resourceId => {
      const resource = resources[resourceId];
      return (
        resource.kind === kind &&
        resource.verbs.includes('create')
      );
    });

  // error if more than 1 result
  if (resourceIds.length !== 1) return null;
  else return resources[resourceIds[0]];
}

export const itemState = {};


// saga
// ------

function* sagaItemGet() {
  yield takeEvery(ITEM_GET, function* (action) {
    try {
      const { id } = action.payload;
      const item = yield select(stateItemGet, id);
      if (item) {
        const yaml = yield call(apiItemGetYaml, item[URL]);
        yield put({
          type: ITEM_GET__S,
          payload: { yaml },
          meta: { id },
        });
      }
    }

    catch (error) {
      yield put({
        type: ITEM_GET__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaItemPost() {
  yield takeEvery(ITEM_POST, function* (action) {
    try {
      let { id, yaml } = action.payload;

      // parse item
      const { kind, metadata: { namespace } = {}} = jsYaml.safeLoad(yaml);
      if (!kind) throw new Error('Please, specify item\'s kind.');

      // find resource
      const resource = yield select(stateResourceGetByKind, kind);
      if (!resource) throw new Error('Can\'t find correponding resource by kind.');

      // get url
      const {
        [URL]: resourceUrl,
        [URL_PART_GROUP]: resourceUrlPartGroup,
        [URL_PART_RESOURCE]: resourceUrlPartResource,
      } = resource;
      const url = namespace
        ? `${resourceUrlPartGroup}/namespaces/${namespace}/${resourceUrlPartResource}`
        : resourceUrl;

      // post
      const item = yield call(apiItemPost, url, yaml);
      if (item.status === 'Failure') throw item;

      // decorate item
      decorateItem(resource)(item);

      //
      yield put({
        type: ITEM_POST__S,
        payload: { item },
        meta: { resource },
      });

      // update tab
      yield put(tabClose(id));
      yield put(tabOpen(item[ID]));
    }

    catch (error) {
      yield put({
        type: ITEM_POST__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaItemPut() {
  yield takeEvery(ITEM_PUT, function* (action) {
    try {
      const { id, yaml } = action.payload;
      const { [URL]: url } = yield select(stateItemGet, id);

      // put
      const item = yield call(apiItemPut, url, yaml);
      if (item.status === 'Failure') throw item;

      //
      yield put({
        type: ITEM_PUT__S,
        payload: { item },
        meta: { id, yaml },
      });
    }

    catch (error) {
      yield put({
        type: ITEM_PUT__F,
        payload: error,
        error: true,
      });
    }
  });
}

function* sagaItemDelete() {
  yield takeEvery(ITEM_DELETE, function* (action) {
    try {
      const { id: itemId } = action.payload;
      const {
        [URL]: itemUrl,
        [RESOURCE]: resourceId,
      } = yield select(stateItemGet, itemId);

      //
      const item = yield call(apiItemDelete, itemUrl);
      if (item.status === 'Failure') throw item;

      //
      yield put({
        type: ITEM_DELETE__S,
        meta: { itemId, resourceId },
      });

      //
      yield put(tabClose(itemId));
    }

    catch (error) {
      yield put({
        type: ITEM_DELETE__F,
        payload: error,
        error: true,
      });
    }
  });
}

export function* itemSaga() {
  yield all([
    sagaItemGet(),
    sagaItemPost(),
    sagaItemPut(),
    sagaItemDelete(),
  ]);
}


// reducer
// ---------

export const itemReducer = {

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
          [ITEMS]: { $push: [itemId] },
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
          [ITEMS]: { $pop: [itemId] },
        },
      },
      items: { $del: [itemId] },
    });
  },
};
