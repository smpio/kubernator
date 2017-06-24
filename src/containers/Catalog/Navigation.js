import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import {
  PREFIX,
  ID,
  RESOURCE,
  LOADING,
  treeGet,
  tabOpen,
} from '../../modules/catalog';

import { Tree as TreeRoot, Spin } from 'antd';
const TreeNode = TreeRoot.TreeNode;

const TYPE_NAMESPACE = 'TYPE_NAMESPACE';
const TYPE_KIND = 'TYPE_KIND';
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
    this.renderNode = this.renderNode.bind(this);
  }

  componentDidMount() {
    const { tree, treeGet } = this.props;
    if (!tree.length) treeGet();
  }

  onSelect(selectedKeys, event) {
    const { custom: { type, data } = {}} = event.node.props;
    const { tabOpen } = this.props;
    if (type === TYPE_ITEM) tabOpen(data[ID]);
    else if (selectedKeys.length) this.setState({ expandedKeys: selectedKeys });
  }

  onExpand(expandedKeys, { expanded, node }) {
    const { eventKey: closedKey } = node.props;
    if (!expanded && !closedKey.includes(':')) { // hard coded crunch for the current key naming
      expandedKeys = expandedKeys.filter(key => !key.startsWith(closedKey));
    }
    this.setState({ expandedKeys });
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
      data,
    } = node;

    const hasChildren = children.length;

    return (
      <TreeNode 
        key={id}
        title={name}
        isLeaf={!hasChildren}
        custom={{ type, data }}>
        {
          hasChildren &&
          children.map(node => renderNode(node))
        }
      </TreeNode>
    );
  }

  render() {
    const {
      props: {
        loading,
        tree,
      },
      state: {
        expandedKeys,
      },
      onSelect,
      onExpand,
      renderNode,
    } = this;

    return (
      <div className="catalog__navigation">
        {
          loading &&
          <div className="catalog__spinner">
            <Spin tip={loading} />
          </div>
        }
        {
          !loading &&
          <TreeRoot
            onSelect={onSelect}
            onExpand={onExpand}
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

function analyzeItems(resources, items) {
  const nonamespace = '[nonamespace]';
  const namespaces = { /* namespaceId: { kindId, ... } */ };
  const kinds = { /* kindId: { itemId, ... } */ };
  Object.keys(items).forEach(itemId => {

    // get item
    const {
      metadata: {
        namespace: itemNamespace,
      },
      [RESOURCE]: resourceId,
    } = items[itemId];

    // get resource
    const {
      namespaced: resourceNamespaced,
      kind: resourceKind,
    } = resources[resourceId];

    // get namespace
    const ns = resourceNamespaced
      ? itemNamespace || nonamespace
      : nonamespace;

    // get kind
    // prefix to not mix items
    const kind = `${ns}:${resourceKind}`;

    // create namespace
    if (!namespaces[ns]) namespaces[ns] = {};
    namespaces[ns][kind] = true;

    // create kind
    if (!kinds[kind]) kinds[kind] = {};
    kinds[kind][itemId] = true;
  });
  return {
    namespaces,
    kinds,
  };
}

function sortByName(a, b) {
  const aname = a.name;
  const bname = b.name;
  return (aname > bname) ? 1 : (aname === bname) ? 0 : -1;
}

function buildItems(itemIds, items) {
  return Object.keys(itemIds)
    .map(itemId => {
      const item = items[itemId];
      const { metadata: { name: itemName }} = item;
      return {
        type: TYPE_ITEM,
        id: itemId,
        name: itemName,
        children: [],
        data: item,
      };
    })
    .sort(sortByName);
}

function buildKinds(kindIds, kinds, ...args) {
  return Object.keys(kindIds)
    .map(nsKindId => {
      const kindId = nsKindId.split(':')[1];
      return {
        type: TYPE_KIND,
        id: nsKindId,
        name: kindId,
        children: buildItems(kinds[nsKindId], ...args),
        data: {},
      };
    })
    .sort(sortByName);
}

function buildNamespaces(namespaces, ...args) {
  return Object.keys(namespaces)
    .sort()
    .map(namespaceId => ({
      type: TYPE_NAMESPACE,
      id: namespaceId,
      name: namespaceId,
      children: buildKinds(namespaces[namespaceId], ...args),
      data: {},
    }));
}

const selectLoading = state => state[LOADING];
const selectResources = state => state.resources;
const selectItems = state => state.items;

const selectTree = createSelector(
  [selectLoading, selectResources, selectItems],
  (loading, resources, items) => {
    if (loading) return [];
    else {
      const { namespaces, kinds } = analyzeItems(resources, items);
      return buildNamespaces(namespaces, kinds, items);
    }
  },
);


// connect
// ---------

Navigation.propTypes = {
  loading: PropTypes.string,
  resources: PropTypes.object,
  items: PropTypes.object,
  tree: PropTypes.array,
  treeGet: PropTypes.func,
  tabOpen: PropTypes.func,
};

export default connect(
  state => {
    const local = state[PREFIX];
    return {
      loading: selectLoading(local),
      resources: selectResources(local),
      items: selectItems(local),
      tree: selectTree(local),
    };
  },
  dispatch => bindActionCreators({
    treeGet,
    tabOpen,
  }, dispatch),
)(Navigation);
