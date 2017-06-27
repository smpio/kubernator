import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import {
  PREFIX,
  ID,
  ITEMS,
  LISTABLE,
  LOADING_TREE,
  treeGet,
  namespaceItemsGet,
  resourceItemsGet,
  tabOpen,
} from '../../modules/catalog';

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
    const { loadingTree } = props.flags;
    const { loadingTree: loadingTreePrev } = this.props.flags;

    if (loadingTree) return loadingTree !== loadingTreePrev;
    else return true;
  }

  componentDidMount() {
    const { tree, treeGet } = this.props;
    if (!tree.length) treeGet();
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
    const { namespaceItemsGet, resourceItemsGet } = this.props;
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
        (resolve, reject) => resourceItemsGet(resource, namespaced && name, resolve, reject)
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
          loadingTree,
        },
        tree,
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
          loadingTree &&
          <div className="catalog__spinner">
            <Spin tip={loadingTree} />
          </div>
        }
        {
          !loadingTree &&
          <TreeRoot
            onSelect={onSelect}
            onExpand={onExpand}
            loadData={onLoadData}
            expandedKeys={expandedKeys}
            showLine>
            {
              tree.map(node => renderNode(node))
            }
          </TreeRoot>
        }
      </div>
    );
  }
}


// custom tree selectors
// -----------------------

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
      namespaced: namespaceNamespaced,
      name: namespaceName,
    },
  } = argsLocal;
  return Object.keys(resources)

    .filter(id => {
      const {
        namespaced,
        [ITEMS]: itemIds,
        [LISTABLE]: listable,
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
      const { kind, [ITEMS]: itemIds } = resource;
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
  const { resources, items } = argsGlobal;

  // get namespaces
  const namespaces = resources.namespaces[ITEMS].map(id => ({
    name: items[id].metadata.name,
    namespaced: true,
  }));

  // append nonamespace
  namespaces.unshift({ name: '[nonamespace]' });

  //
  return namespaces

    .map(namespace => {
      const { name } = namespace;
      return {
        type: TYPE_NAMESPACE,
        id: name,
        name,
        children: buildKinds(argsGlobal, { namespace }),
        payload: { namespace },
      };
    })

    .sort(sortByName);
}

const selectFlags = state => ({
  loadingTree: state.flags[LOADING_TREE],
});

const selectResources = state => state.resources;
const selectItems = state => state.items;

const selectTree = createSelector(
  [selectFlags, selectResources, selectItems],
  (flags, resources, items) => {
    if (flags.loadingTree || !Object.keys(resources).length) return [];
    else return buildNamespaces({ resources, items });
  },
);

const selectAll = createSelector(
  [selectFlags, selectResources, selectItems, selectTree],
  (flags, resources, items, tree) => ({
    flags,
    resources,
    items,
    tree,
  }),
);


// connect
// ---------

Navigation.propTypes = {
  flags: PropTypes.object,
  resources: PropTypes.object,
  items: PropTypes.object,
  tree: PropTypes.array,
  treeGet: PropTypes.func,
  namespaceItemsGet: PropTypes.func,
  resourceItemsGet: PropTypes.func,
  tabOpen: PropTypes.func,
};

export default connect(
  state => selectAll(state[PREFIX]),
  dispatch => bindActionCreators({
    treeGet,
    namespaceItemsGet,
    resourceItemsGet,
    tabOpen,
  }, dispatch),
)(Navigation);
