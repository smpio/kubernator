import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import throttle from 'react-throttle-render';
import { Tree as TreeRoot, Spin } from 'antd';

import {
  PREFIX,
  ID,
  UI_THROTTLE,
  catalogGet,
  namespaceItemsGet,
  itemsGet,
  tabOpen,
} from 'modules/k8s';

import {
  TYPE_NAMESPACE,
  TYPE_RESOURCE,
  TYPE_ITEM,
  selectAll,
} from './selectors';
import css from './index.css';

const TreeNode = TreeRoot.TreeNode;


@connect(
  state => selectAll(state[PREFIX]),
  dispatch => bindActionCreators({
    catalogGet,
    namespaceItemsGet,
    itemsGet,
    tabOpen,
  }, dispatch),
)

@throttle(UI_THROTTLE)

export default class Navigation extends React.Component {

  static propTypes = {
    flags: PropTypes.object.isRequired,
    resources: PropTypes.object.isRequired,
    items: PropTypes.object.isRequired,
    namespaces: PropTypes.array.isRequired,
    catalog: PropTypes.array.isRequired,
    catalogGet: PropTypes.func.isRequired,
    namespaceItemsGet: PropTypes.func.isRequired,
    itemsGet: PropTypes.func.isRequired,
    tabOpen: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { expandedKeys: [] };
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

  onSelect = (selectedKeys, event) => {
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
  };

  onExpand = (expandedKeys, { expanded, node }) => {
    const { eventKey: closedKey } = node.props;
    if (!expanded && !closedKey.includes(':')) { // hard coded crunch for the current key naming
      expandedKeys = expandedKeys.filter(key => !key.startsWith(closedKey));
    }
    this.setState({ expandedKeys });
  };

  onLoadData = treeNode => {
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
  };

  renderNode = node => {
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
  };

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
      <div className={css.navigation}>
        {
          loadingCatalog &&
          <div className={css.spinner}>
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
