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
} from '../../../modules/catalog';

import './index.css';

import { Tree as TreeRoot } from 'antd';
const TreeNode = TreeRoot.TreeNode;

const TYPE_GROUP = 'TYPE_GROUP';
const TYPE_RESOURCE = 'TYPE_RESOURCE';


// render helpers
// ----------------
// not react elements because antd expects direct nesting

function renderItem(props) {
  const {
    itemUid,
    items,
  } = props;

  const {
    metadata: {
      name,
    },
  } = items[itemUid];

  return (
    <TreeNode
      key={name}
      title={name}
      isLeaf
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
      customType={TYPE_RESOURCE}
      customData={resource}
      disabled={!isExpandable}
      isLeaf={!isExpandable}>
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
      customType={TYPE_GROUP}
      customData={group}>
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
    //this.onSelect = this.onSelect.bind(this);
  }

  onLoadData(treeNode) {
    const { customType: type, customData: data } = treeNode.props;
    const { resourcesGet, itemsGet } = this.props;
    return new Promise((resolve, reject) => {
      switch (type) {
        case TYPE_GROUP: return resourcesGet(data, resolve, reject);
        case TYPE_RESOURCE: return itemsGet(data, resolve, reject);
        default: return resolve();
      }
    });
  }

  /*
  onSelect(selectedKeys, e) {
    const { onItemSelect } = this.props
    const { node: { props: { eventKey: key, id }}} = e
    onItemSelect(id)
  }
  */

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
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    groupsGet,
    resourcesGet,
    itemsGet,
  }, dispatch),
)(Navigation);
