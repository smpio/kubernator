import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  KINDS,
  NAMESPACES,
  groupsGet,
  resourcesGet,
  itemsGet,
  itemGet,
} from '../../modules/catalog';

import { Tree as TreeRoot } from 'antd';
const TreeNode = TreeRoot.TreeNode;

const TYPE_GROUP = 'TYPE_GROUP';
const TYPE_RESOURCE = 'TYPE_RESOURCE';
const TYPE_ITEM = 'TYPE_ITEM';


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
    const { itemGet } = this.props;
    if (type === TYPE_ITEM) itemGet(data);
  }

  componentWillMount() {
    this.props.groupsGet();
  }

  render() {
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
        <h2>Navigation</h2>
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

Navigation.propTypes = {
  groups: PropTypes.object,
  resources: PropTypes.object,
  items: PropTypes.object,
  groupsGet: PropTypes.func,
  resourcesGet: PropTypes.func,
  itemsGet: PropTypes.func,
  itemGet: PropTypes.func,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    groupsGet,
    resourcesGet,
    itemsGet,
    itemGet,
  }, dispatch),
)(Navigation);
