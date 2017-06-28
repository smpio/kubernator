import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import * as d3 from 'd3';

import {
  PREFIX,
  RESOURCE,

  RESOURCE_ROLE,
  RESOURCE_CLUSTER_ROLE,
  RESOURCE_ROLE_BINDING,
  RESOURCE_CLUSTER_ROLE_BINDING,

  ITEM_ROLE,
  ITEM_CLUSTER_ROLE,
  ITEM_ROLE_BINDING,
  ITEM_CLUSTER_ROLE_BINDING,

  NONAMESPACE,
  itemsGet,
} from '../../modules/rbac';


// main class
// ------------

class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.state = { container: null };
    this.d3State = null; // no need fo rerender

    this.getContainer = this.getContainer.bind(this);
    this.d3Create = this.d3Create.bind(this);
    this.d3Update = this.d3Update.bind(this);
  }

  componentDidMount() {
    this.props.itemsGet();
  }

  componentDidUpdate() {
    this.d3Create();
    this.d3Update();
  }

  getContainer(container) {
    this.setState({ container });
  }

  d3Create() {
    const { container } = this.state;

    // create state
    const d3State = this.d3State = {};

    // get svg
    const svg = d3State.svg = d3.select(container);
    svg.selectAll('*').remove();

    // get dimensions
    const { width, height } = svg.node().getBoundingClientRect();
    const center = { x: width / 2, y: height / 2 };

    // force
    const simulation = d3State.simulation = d3.forceSimulation()
      .force('link', d3.forceLink())
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(center.x, center.y));

    // drag
    d3State.drag = d3.drag()
      .on('start', node => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      })
      .on('drag', node => {
        node.fx = d3.event.x;
        node.fy = d3.event.y;
      })
      .on('end', node => {
        if (!d3.event.active) simulation.alphaTarget(0);
        delete node.fx;
        delete node.fy;
      });
  }

  d3Update() {
    const {
      props: {
        nodes,
        links,
      },
      d3State: {
        svg,
        drag,
        simulation,
      },
    } = this;

    let nodesSelection;
    let linksSelection;

    linksSelection = svg.selectAll('.link')
      .data(links, link => link.id)
      .enter()
      .append('line')
      .attr('class', 'link');

    nodesSelection = svg.selectAll('.node')
      .data(nodes, node => node.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(drag);

    nodesSelection.append('circle')
      .attr('r', 5);

    nodesSelection.append('title')
      .text(node => node.name);

    nodesSelection.append('text')
      .attr('dy', 3)
      .text(node => node.name);

    simulation
      .nodes(nodes)
      .on('tick', () => {
        linksSelection
          .attr('x1', link => link.source.x)
          .attr('y1', link => link.source.y)
          .attr('x2', link => link.target.x)
          .attr('y2', link => link.target.y);

        nodesSelection
          .attr('transform', node => `translate(${node.x},${node.y})`);
      });

    simulation.force('link')
      .links(links);
  }

  render() {
    const { getContainer } = this;
    return (
      <div className="rbac__graph">
        <svg ref={getContainer} />
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
      [ITEM_ROLE]: {},
      [ITEM_CLUSTER_ROLE]: {},
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

  createNodeShared(node) {
    const { nodes, nodeIdsByType, getNextId } = this;
    const { type, name } = node;

    // get nodeIds
    const ids = nodeIdsByType[type];

    // get nodeId
    if (!ids[name]) ids[name] = getNextId();
    const id = ids[name];

    // create node if not exists
    if (!nodes[id]) nodes[id] = { ...node, id };

    // return nodeId
    return id;
  }

  createNode(node) {
    const { nodes, getNextId } = this;
    const id = getNextId();
    nodes[id] = { ...node, id };
    return id;
  }

  createLink({ source, target }) {
    const { links, getNextId } = this;
    const id = getNextId();
    links[id] = { id, source, target };
    return id;
  }

  linkBindingsWithRoles() {
    const { nodes } = this;

    const nodesRoles = Object.keys(nodes).filter(id => {
      const { type } = nodes[id];
      return type === ITEM_ROLE || type === ITEM_CLUSTER_ROLE;
    });

    const nodesRoleBindings = Object.keys(nodes).filter(id => {
      const { type } = nodes[id];
      return type === ITEM_ROLE_BINDING || type === ITEM_CLUSTER_ROLE_BINDING;
    });

    nodesRoleBindings.forEach(id => {
      const { kind, name } = nodes[id].roleRef;
      const roleId = nodesRoles.find(id => {
        const { type: nodeType, name: nodeName } = nodes[id];
        return nodeType === kind && nodeName === name;
      });
      if (roleId) {
        this.createLink({
          source: id,
          target: roleId,
        });
      }
    });
  }

  getData() {
    const {
      nodes: nodesObj,
      links: linksObj,
    } = this;

    // id to index mapping
    const nodeIdToIndex = {};

    // nodes
    const nodesArr = Object.keys(nodesObj).map((id, index) => {
      nodeIdToIndex[id] = index;
      return nodesObj[id];
    });

    // links
    const linksArr = Object.keys(linksObj).map(id => {
      const link = linksObj[id];
      return {
        ...link,
        source: nodeIdToIndex[link.source],
        target: nodeIdToIndex[link.target],
      };
    });

    return {
      nodes: nodesArr,
      links: linksArr,
    };
  }
}

const selectNamespace = state => state.namespaces[state.namespaceIndex];
const selectItems = state => state.items;
const selectGraphData = createSelector(
  [selectNamespace, selectItems],
  (namespace, items) => {
    const gd = new GraphData();
    items

      // filter correct namespace
      .filter(item => {
        const { namespace: itemNamespace = NONAMESPACE } = item.metadata;
        return itemNamespace === namespace;
      })

      // build nodes and links
      .forEach(item => {
        const {
          metadata: {
            name,
          },
          roleRef,
          [RESOURCE]: resource,
        } = item;

        // get item type
        let type;
        switch (resource) {
          case RESOURCE_ROLE: type = ITEM_ROLE; break;
          case RESOURCE_CLUSTER_ROLE: type = ITEM_CLUSTER_ROLE; break;
          case RESOURCE_ROLE_BINDING: type = ITEM_ROLE_BINDING; break;
          case RESOURCE_CLUSTER_ROLE_BINDING: type = ITEM_CLUSTER_ROLE_BINDING; break;
        }

        //
        switch (type) {

          case ITEM_ROLE:
          case ITEM_CLUSTER_ROLE:

            // role
            const roleId = gd.createNodeShared({ type, name });

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

          case ITEM_ROLE_BINDING:
          case ITEM_CLUSTER_ROLE_BINDING:

            // rolebinding
            const rolebindingId = gd.createNode({ type, name, roleRef });

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

          default:
            break;
        }
      });

    // add rolebinding -> role links
    gd.linkBindingsWithRoles();

    //
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
  state => selectGraphData(state[PREFIX]),
  dispatch => bindActionCreators({
    itemsGet,
  }, dispatch),
)(Graph);
