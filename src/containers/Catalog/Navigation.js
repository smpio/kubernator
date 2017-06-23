import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import {
  PREFIX,
  ID,
  RESOURCE,
  ITEMS,
  LOADING,
  treeGet,
  tabOpen,
} from '../../modules/catalog';

import { Tree as TreeRoot, Spin } from 'antd';
const TreeNode = TreeRoot.TreeNode;

const TYPE_RESOURCE = 'TYPE_RESOURCE';
const TYPE_ITEM = 'TYPE_ITEM';


// render helpers
// ----------------
// not react elements because antd expects direct nesting

function renderItem(props) {
  const { itemId, items } = props;

  const item = items[itemId];
  const { metadata: { name }} = item;

  return (
    <TreeNode
      key={itemId}
      title={name}
      isLeaf
      custom={{
        type: TYPE_ITEM,
        data: item,
      }}
    />
  );
}

function renderResource(props) {
  const { resourceId, resources } = props;

  const resource = resources[resourceId];
  const { name, [ITEMS]: items } = resource;
  const hasItems = items.length;

  return (
    <TreeNode
      key={resourceId}
      title={name}
      disabled={!hasItems}
      isLeaf={!hasItems}
      custom={{
        type: TYPE_RESOURCE,
        data: resource,
      }}>
      {
        hasItems &&
        resource[ITEMS].map(itemId =>
          renderItem({ itemId, ...props }),
        )
      }
    </TreeNode>
  );
}

function renderKind(props) {
  const { kindId, kinds } = props;
  const resources = kinds[kindId];
  return (
    <TreeNode key={kindId} title={kindId}>
      {
        resources.map(resourceId =>
          renderResource({ resourceId, ...props }),
        )
      }
    </TreeNode>
  );
}

function renderNamespace(props) {
  const { namespaceId, namespaces } = props;
  const kinds = namespaces[namespaceId];
  return (
    <TreeNode key={namespaceId} title={namespaceId}>
      {
        kinds.map(kindId =>
          renderKind({ kindId, ...props }),
        )
      }
    </TreeNode>
  );
}


// main class
// ------------

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
  }

  onSelect(selectedKeys, event) {
    const { custom: { type, data } = {}} = event.node.props;
    const { tabOpen } = this.props;
    if (type === TYPE_ITEM) tabOpen(data[ID]);
  }

  componentWillMount() {
    this.props.treeGet();
  }

  render() {
    const {
      props,
      props: {
        loading,
        tree,
      },
      onSelect,
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
          <TreeRoot onSelect={onSelect} showLine>
            {
              tree.map(namespaceId =>
                renderNamespace({ namespaceId, ...props }),
              )
            }
          </TreeRoot>
        }
      </div>
    );
  }
}


// connect
// ---------

const selectLoading = state => state[LOADING];
const selectResources = state => state.resources;
const selectItems = state => state.items;

const selectCustomData = createSelector(
  [selectLoading, selectResources, selectItems],
  (loading, resources, items) => {

    // prepare data
    const data = {
      namespaces: { /* namespaceName: { kindName, ... } */ },
      kinds: { /* kindName: { resourceId, ... } */ },
    };

    // proceed if not loading only
    if (!loading) {
      const { namespaces, kinds } = data;
      const nonamespace = '[nonamespace]';

      // build tree as objects initially
      // to save some complexity on lookup operations
      // ----------------------------------------------

      // iterate items
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

        // create namespace
        if (!namespaces[ns]) namespaces[ns] = {};
        namespaces[ns][resourceKind] = true;

        // create kind
        if (!kinds[resourceKind]) kinds[resourceKind] = {};
        kinds[resourceKind][resourceId] = true;
      });

      // cast tree from objects to sorted arrays
      // -----------------------------------------

      // sort kinds in namespaces
      Object.keys(namespaces).forEach(namespace => {
        const kinds = Object.keys(namespaces[namespace]);
        namespaces[namespace] = kinds.sort();
      });

      // sort resources in kinds
      Object.keys(kinds).forEach(kind => {
        const resources = Object.keys(kinds[kind]);
        kinds[kind] = resources.sort();
      });
    }

    //
    return data;
  },
);

const selectTree = createSelector(
  selectCustomData,
  ({ namespaces, kinds }) => Object.keys(namespaces).sort(),
);

Navigation.propTypes = {
  loading: PropTypes.string,
  tree: PropTypes.object,
  namespaces: PropTypes.object,
  kinds: PropTypes.object,
  resources: PropTypes.object,
  items: PropTypes.object,
  treeGet: PropTypes.func,
  tabOpen: PropTypes.func,
};

export default connect(
  state => {
    const local = state[PREFIX];
    return {
      loading: selectLoading(local),
      tree: selectTree(local),
      ...selectCustomData(local),
      resources: selectResources(local),
      items: selectItems(local),
    };
  },
  dispatch => bindActionCreators({
    treeGet,
    tabOpen,
  }, dispatch),
)(Navigation);
