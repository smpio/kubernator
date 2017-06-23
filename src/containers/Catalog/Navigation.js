import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import {
  PREFIX,
  LOADING,
  RESOURCE,
  //UID,
  //KINDS,
  //NAMESPACES,
  treeGet,
  tabOpen,
} from '../../modules/catalog';

import { Tree as TreeRoot, Spin } from 'antd';
const TreeNode = TreeRoot.TreeNode;

//const TYPE_GROUP = 'TYPE_GROUP';
//const TYPE_RESOURCE = 'TYPE_RESOURCE';
//const TYPE_ITEM = 'TYPE_ITEM';

class Navigation extends React.Component {

  componentWillMount() {
    this.props.treeGet();
  }

  render() {
    const {
      loading,
    } = this.props;
    return (
      <div>
        {
          loading &&
          <Spin tip={loading} />
        }
        {
          !loading &&
          <span>done</span>
        }
      </div>
    );
  }
}

/*

// render helpers
// ----------------
// not react elements because antd expects direct nesting

function renderItem(props) {
  const {
    itemUid,
    items,
  } = props;

  const item = items[itemUid];
  const { metadata: { name }} = item;

  return (
    <TreeNode
      key={name}
      title={name}
      isLeaf
      custom={{
        type: TYPE_ITEM,
        data: item,
      }}
    />
  );
}

function renderNamespace(props) {
  const {
    namespaceName,
    itemUids,
    items,
  } = props;

  return (
    <TreeNode
      key={namespaceName}
      title={namespaceName}>
      {
        itemUids.map(itemUid =>
          renderItem({
            itemUid,
            items,
          }),
        )
      }
    </TreeNode>
  );
}

function renderResource(props) {
  const {
    resourceName,
    resources,
    items,
  } = props;

  const resource = resources[resourceName];
  const { [NAMESPACES]: namespaces, verbs } = resource;

  const isExpandable = verbs.includes('list');

  return (
    <TreeNode
      key={resourceName}
      title={resourceName}
      disabled={!isExpandable}
      isLeaf={!isExpandable}
      custom={{
        type: TYPE_RESOURCE,
        data: resource,
      }}>
      {
        isExpandable &&
        Object.keys(namespaces).map(namespaceName =>
          renderNamespace({
            namespaceName,
            itemUids: namespaces[namespaceName],
            items,
          }),
        )
      }
    </TreeNode>
  );
}

function renderKind(props) {
  const {
    kindName,
    resourceNames,
    resources,
    items,
  } = props;

  return (
    <TreeNode
      key={kindName}
      title={kindName}>
      {
        resourceNames.map(resourceName =>
          renderResource({
            resourceName,
            resources,
            items,
          }),
        )
      }
    </TreeNode>
  );
}

function renderGroup(props) {
  const {
    groupName,
    groups,
    resources,
    items,
  } = props;

  const group = groups[groupName];
  const { [KINDS]: kinds } = group;

  return (
    <TreeNode
      key={groupName}
      title={groupName}
      custom={{
        type: TYPE_GROUP,
        data: group,
      }}>
      {
        Object.keys(kinds).map(kindName =>
          renderKind({
            kindName,
            resourceNames: kinds[kindName],
            resources,
            items,
          }),
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
    this.onLoadData = this.onLoadData.bind(this);
    this.onSelect = this.onSelect.bind(this);
  }

  onLoadData(treeNode) {
    const { custom: { type, data } = {}} = treeNode.props;
    const { resourcesGet, itemsGet } = this.props;
    return new Promise((resolve, reject) => {
      switch (type) {
        case TYPE_GROUP: return resourcesGet(data, resolve, reject);
        case TYPE_RESOURCE: return itemsGet(data, resolve, reject);
        default: return resolve();
      }
    });
  }

  onSelect(selectedKeys, event) {
    const { custom: { type, data } = {}} = event.node.props;
    const { tabOpen } = this.props;
    if (type === TYPE_ITEM) tabOpen(data[UID]);
  }

  componentWillMount() {
    this.props.treeGet();
  }

  render() { return null;
    const {
      props: {
        groups,
        resources,
        items,
      },
      onLoadData,
      onSelect,
    } = this;

    return (
      <div className="navigation">
        <TreeRoot
          loadData={onLoadData}
          onSelect={onSelect}
          showLine>
          {
            Object.keys(groups).map(groupName =>
              renderGroup({
                groupName,
                groups,
                resources,
                items,
              }),
            )
          }
        </TreeRoot>
      </div>
    );
  }
}

*/


// connect
// ---------

const selectLoading = state => state.root[LOADING];
const selectResources = state => state.resources;
const selectItems = state => state.items;

const selectTree = createSelector(
  [selectLoading, selectResources, selectItems],
  (loading, resources, items) => {

    // prepare data
    const tree = {
      namespaces: { /* namespaceName: { kindName, ... } */ },
      kinds: { /* kindName: { resourceId, ... } */ },
    };

    // proceed if not loading only
    if (!loading) {
      const { namespaces, kinds } = tree;
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
    return tree;
  },
);

Navigation.propTypes = {
  loading: PropTypes.any,
  resources: PropTypes.object,
  items: PropTypes.object,
  tree: PropTypes.object,
  treeGet: PropTypes.func,
  tabOpen: PropTypes.func,
};

export default connect(
  state => ({
    loading: selectLoading(state[PREFIX]),
    resources: selectResources(state[PREFIX]),
    items: selectItems(state[PREFIX]),
    tree: selectTree(state[PREFIX]),
  }),
  dispatch => bindActionCreators({
    treeGet,
    tabOpen,
  }, dispatch),
)(Navigation);
