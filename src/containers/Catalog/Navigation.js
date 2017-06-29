import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import throttle from 'react-throttle-render';

import {
  PREFIX,
  ID,
  ITEM_IDS,
  IS_LISTABLE,
  IS_LOADING_CATALOG,
  NO_NAMESPACE,
  catalogGet,
  namespaceItemsGet,
  itemsGet,
  tabOpen,
} from '../../modules/k8s';

import { Tree as TreeRoot, Spin } from 'antd';
const TreeNode = TreeRoot.TreeNode;

const TYPE_NAMESPACE = 'TYPE_NAMESPACE';
const TYPE_RESOURCE = 'TYPE_RESOURCE';
const TYPE_ITEM = 'TYPE_ITEM';


// main class
// ------------

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedKeys: [],
    };
    this.onSelect = this.onSelect.bind(this);
    this.onExpand = this.onExpand.bind(this);
    this.onLoadData = this.onLoadData.bind(this);
    this.renderNode = this.renderNode.bind(this);
  }

  shouldComponentUpdate(props) {
    const { loadingCatalog } = props.flags;
    const { loadingCatalog: loadingCatalogPrev } = this.props.flags;

    if (loadingCatalog) return loadingCatalog !== loadingCatalogPrev;
    else return true;
  }

  componentDidMount() {
    const { namespaces, catalog, catalogGet } = this.props;
    if (!catalog.length || catalog.length !== namespaces.length) catalogGet();
  }

  onSelect(selectedKeys, event) {
    const {
      props: {
        tabOpen,
      },
      onLoadData,
    } = this;

    const {
      node,
      node: {
        props: {
          custom: {
            type,
            payload,
          } = {},
        },
      },
    } = event;

    // namespace || resource -> reload
    if (type === TYPE_NAMESPACE || type === TYPE_RESOURCE) onLoadData(node);

    // item -> edit
    if (type === TYPE_ITEM) tabOpen(payload.item[ID]);

    // not item -> update keys
    else if (selectedKeys.length) this.setState({ expandedKeys: selectedKeys });
  }

  onExpand(expandedKeys, { expanded, node }) {
    const { eventKey: closedKey } = node.props;
    if (!expanded && !closedKey.includes(':')) { // hard coded crunch for the current key naming
      expandedKeys = expandedKeys.filter(key => !key.startsWith(closedKey));
    }
    this.setState({ expandedKeys });
  }

  onLoadData(treeNode) {
    const { namespaceItemsGet, itemsGet } = this.props;
    const { custom: { type, payload } = {}} = treeNode.props;

    // namespace
    if (type === TYPE_NAMESPACE) {
      const { namespace: { namespaced, name }} = payload;
      return new Promise(
        (resolve, reject) => namespaceItemsGet(namespaced && name, resolve, reject)
      );
    }

    // resource
    else if (type === TYPE_RESOURCE) {
      const { resource, namespace: { namespaced, name }} = payload;
      return new Promise(
        (resolve, reject) => itemsGet(resource, namespaced && name, resolve, reject)
      );
    }

    //
    else return Promise.resolve();
  }

  renderNode(node) {
    const {
      renderNode,
    } = this;

    const {
      type,
      id,
      name,
      children,
      payload,
    } = node;

    return (
      <TreeNode 
        key={id}
        title={name}
        isLeaf={!children}
        custom={{ type, payload }}>
        {
          children &&
          children.length &&
          children.map(node => renderNode(node))
        }
      </TreeNode>
    );
  }

  render() {
    const {
      props: {
        flags: {
          loadingCatalog,
        },
        catalog,
      },
      state: {
        expandedKeys,
      },
      onSelect,
      onExpand,
      onLoadData,
      renderNode,
    } = this;

    return (
      <div className="catalog__navigation">
        {
          loadingCatalog &&
          <div className="catalog__spinner">
            <Spin tip={loadingCatalog} />
          </div>
        }
        {
          !loadingCatalog &&
          <TreeRoot
            onSelect={onSelect}
            onExpand={onExpand}
            loadData={onLoadData}
            expandedKeys={expandedKeys}
            showLine>
            {
              catalog.map(node => renderNode(node))
            }
          </TreeRoot>
        }
      </div>
    );
  }
}


// selectors
// -----------

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
  const { resources, items } = argsGlobal;
  const {
    namespace,
    namespace: {
      name: namespaceName,
      namespaced: namespaceNamespaced,
    },
  } = argsLocal;
  return Object.keys(resources)

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

    .map(id => {
      const resource = resources[id];
      const { kind, [ITEM_IDS]: itemIds } = resource;
      return {
        type: TYPE_RESOURCE,
        id: `${namespaceName}:${kind}`,
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

const selectFlags = state => ({
  loadingCatalog: state.flags[IS_LOADING_CATALOG],
});

const selectNamespaces = state => state.namespaces;
const selectResources = state => state.resources;
const selectItems = state => state.items;

const selectCatalog = createSelector(
  [selectFlags, selectResources, selectItems, selectNamespaces],
  (flags, resources, items, namespaces) => {
    if (flags.loadingCatalog || !namespaces.length || !Object.keys(resources).length) return [];
    else return buildNamespaces({ namespaces, resources, items });
  },
);

const selectAll = createSelector(
  [selectFlags, selectResources, selectItems, selectNamespaces, selectCatalog],
  (flags, resources, items, namespaces, catalog) => ({
    flags,
    resources,
    items,
    namespaces,
    catalog,
  }),
);


// connect
// ---------

Navigation.propTypes = {
  flags: PropTypes.object,
  resources: PropTypes.object,
  items: PropTypes.object,
  namespaces: PropTypes.array,
  catalog: PropTypes.array,
  catalogGet: PropTypes.func,
  namespaceItemsGet: PropTypes.func,
  itemsGet: PropTypes.func,
  tabOpen: PropTypes.func,
};

export default connect(
  state => selectAll(state[PREFIX]),
  dispatch => bindActionCreators({
    catalogGet,
    namespaceItemsGet,
    itemsGet,
    tabOpen,
  }, dispatch),
)(throttle(100)(Navigation));
