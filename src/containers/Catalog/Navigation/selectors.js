import { createSelector } from 'reselect';

import {
  VERSION,
  GROUP_ID,
  ITEM_IDS,
  IS_LISTABLE,
  NO_NAMESPACE,
} from '../../../modules/k8s';


export const TYPE_NAMESPACE = 'TYPE_NAMESPACE';
export const TYPE_RESOURCE = 'TYPE_RESOURCE';
export const TYPE_ITEM = 'TYPE_ITEM';


const sortByName = (a, b) =>
  (a.name > b.name) ? 1 : (a.name === b.name) ? 0 : -1;

function buildItems(argsGlobal, argsLocal) {
  const { items } = argsGlobal;
  const {
    namespace: {
      namespaced: namespaceNamespaced,
      name: namespaceName,
    },
    itemIds,
  } = argsLocal;
  return itemIds

    .filter(id => {
      const { metadata: { namespace: itemNamespace }} = items[id];
      if (namespaceNamespaced) return itemNamespace === namespaceName;
      else return !itemNamespace;
    })

    .map(id => {
      const item = items[id];
      const { metadata: { name }} = item;
      return {
        type: TYPE_ITEM,
        id,
        name,
        children: null,
        payload: { item },
      };
    })

    .sort(sortByName);
}

function buildKinds(argsGlobal, argsLocal) {

  const {
    groups,
    resources,
    items,
  } = argsGlobal;

  const {
    namespace,
    namespace: {
      name: namespaceName,
      namespaced: namespaceNamespaced,
    },
  } = argsLocal;

  const selection = Object.keys(resources)

    .filter(id => {
      const {
        namespaced,
        [ITEM_IDS]: itemIds,
        [IS_LISTABLE]: listable,
      } = resources[id];
      return (
        listable &&
        namespaced === !!namespaceNamespaced &&
        itemIds.some(id => {
          const { metadata: { namespace: itemNamespace }} = items[id];
          if (namespaceNamespaced) return itemNamespace === namespaceName;
          else return !itemNamespace;
        })
      );
    })

    .reduce(
      (selection, id) => {

        const {
          kind: resourceKind,
          [VERSION]: resourceVersion,
          [GROUP_ID]: groupId,
        } = resources[id];

        const {
          versions: groupVersions,
        } = groups[groupId];

        const index = groupVersions
          .map(version => version.version)
          .indexOf(resourceVersion);

        const data = selection[resourceKind];
        if (!data || data.index > index) {
          selection[resourceKind] = { id, index };
        }

        return selection;
      },
      {},
    );

  return Object.keys(selection)
    .map(key => selection[key].id)

    .map(id => {
      const resource = resources[id];
      const { kind, [ITEM_IDS]: itemIds } = resource;
      return {
        type: TYPE_RESOURCE,
        id: `${namespaceName}:${id}`,
        name: kind,
        children: buildItems(argsGlobal, { namespace, itemIds }),
        payload: { resource, namespace },
      };
    })

    .sort(sortByName);
}

function buildNamespaces(argsGlobal) {
  const { namespaces } = argsGlobal;
  return namespaces

    .map(namespaceName => {
      const namespace = {
        name: namespaceName,
        namespaced: namespaceName !== NO_NAMESPACE,
      };
      return {
        type: TYPE_NAMESPACE,
        id: namespaceName,
        name: namespaceName,
        children: buildKinds(argsGlobal, { namespace }),
        payload: { namespace },
      };
    })

    .sort(sortByName);
}

const selectFlags = state => state.flags;
const selectGroups = state => state.groups;
const selectResources = state => state.resources;
const selectItems = state => state.items;
const selectNamespaces = state => state.namespaces;

const selectCatalog = createSelector(
  [selectFlags, selectGroups, selectResources, selectItems, selectNamespaces],
  (flags, groups, resources, items, namespaces) => {
    if (flags.loadingStage || !namespaces.length || !Object.keys(resources).length) return [];
    else return buildNamespaces({ groups, resources, items, namespaces });
  },
);

export const selectAll = createSelector(
  [selectFlags, selectResources, selectItems, selectNamespaces, selectCatalog],
  (flags, resources, items, namespaces, catalog) => ({
    flags,
    resources,
    items,
    namespaces,
    catalog,
  }),
);
