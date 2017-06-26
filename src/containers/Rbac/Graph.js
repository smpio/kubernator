import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import {
  PREFIX,
  RESOURCE,
  RESOURCE_ROLE,
  RESOURCE_CLUSTER_ROLE,
  RESOURCE_ROLE_BINDING,
  RESOURCE_CLUSTER_ROLE_BINDING,
  itemsGet,
} from '../../modules/rbac';


// main class
// ------------

class Graph extends React.Component {

  componentDidMount() {
    this.props.itemsGet();
  }

  render() {
    return (
      <div>
        Graph
      </div>
    );
  }
}


// selectors
// -----------

class GraphData {
  constructor() {

    // sequential ids
    this.nextId = 0;

    // data
    this.nodes = {};
    this.links = {};

    // shared nodes
    // nodeType -> nodeName -> nodeId
    this.nodeIdsByType = {
      Role: {},
      User: {},
      Group: {},
      ServiceAccount: {},
    };

    //
    this.getNextId = this.getNextId.bind(this);
  }

  getNextId() {
    return ++this.nextId;
  }

  createNodeShared({ type, name }) {
    const { nodes, nodeIdsByType, getNextId } = this;

    // get nodeIds
    const ids = nodeIdsByType[type];

    // get nodeId
    if (!ids[name]) ids[name] = getNextId();
    const id = ids[name];

    // create node if not exists
    if (!nodes[id]) nodes[id] = { id, name };

    // return nodeId
    return id;
  }

  createNode({ name }) {
    const { nodes, getNextId } = this;
    const id = getNextId();
    nodes[id] = { id, name };
    return id;
  }

  createLink({ source, target }) {
    const { links, getNextId } = this;
    const id = getNextId();
    links[id] = { id, source, target };
    return id;
  }

  getData() {
    const { nodes, links } = this;
    return {
      nodes: Object.keys(nodes).map(id => nodes[id]),
      links: Object.keys(links).map(id => links[id]),
    };
  }
}

const selectItems = state => state.items;
const selectGraph = createSelector(
  selectItems,
  items => {
    const gd = new GraphData();
    items.forEach(item => {
      const {
        metadata: {
          namespace = '[nonamespace]',
          name,
        },
        [RESOURCE]: resource,
      } = item;
      switch (resource) {

        case RESOURCE_ROLE:
        case RESOURCE_CLUSTER_ROLE:

          // role
          const roleId = gd.createNodeShared({
            type: 'Role',
            name: `${namespace}:${name}`,
          });

          // children
          item.rules.forEach(rule => {

            // rule
            const ruleId = gd.createNode({
              name: '',
            });

            // link
            gd.createLink({
              source: roleId,
              target: ruleId,
            });

            // children
            // apiGroups, resources, verbs, etc.
            Object.keys(rule).forEach(key => {
              const values = rule[key];

              // key
              const keyId = gd.createNode({
                name: key,
              });

              // link
              gd.createLink({
                source: ruleId,
                target: keyId,
              });

              // children
              values.forEach(value => {

                // value
                const valueId = gd.createNode({
                  name: value,
                });

                // link
                gd.createLink({
                  source: keyId,
                  target: valueId,
                });
              });
            });
          });

          //
          break;

        case RESOURCE_ROLE_BINDING:
        case RESOURCE_CLUSTER_ROLE_BINDING:

          // rolebinding
          const rolebindingId = gd.createNode({
            name: `${namespace}:${name}`,
          });

          // children
          item.subjects.forEach(subject => {
            const { kind, name } = subject;

            // subject
            const subjectId = gd.createNodeShared({
              type: kind,
              name: `${kind}:${name}`,
            });

            // link
            gd.createLink({
              source: rolebindingId,
              target: subjectId,
            });
          });

          //
          break;
      }
    });
    return gd.getData();
  },
);


// connect
// ---------

Graph.propTypes = {
  nodes: PropTypes.array,
  links: PropTypes.array,
  itemsGet: PropTypes.func,
};

export default connect(
  state => selectGraph(state[PREFIX]),
  dispatch => bindActionCreators({
    itemsGet,
  }, dispatch),
)(Graph);
