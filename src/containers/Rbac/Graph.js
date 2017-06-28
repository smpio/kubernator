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

    // create groups
    const canvas = svg.append('g');
    d3State.linksGroup = canvas.append('g');
    d3State.nodesGroup = canvas.append('g');

    // force
    const simulation = d3State.simulation = d3.forceSimulation()
      .force('link', d3.forceLink())
      .force('collide', d3.forceCollide(20 /* radius */))
      .force('charge', d3.forceManyBody().strength(node => -50 /* default is -30 */))
      .force('center', d3.forceCenter(center.x, center.y))
      .velocityDecay(0.1);

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

    // zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 2])
      .on('zoom', () => canvas.attr('transform', d3.event.transform));
    svg.call(zoom);
  }

  d3Update() {
    const {
      props: {
        nodes,
        links,
      },
      d3State: {
        linksGroup,
        nodesGroup,
        drag,
        simulation,
      },
    } = this;

    let nodesSelection;
    let linksSelection;

    linksSelection = linksGroup
      .selectAll('.link')
      .data(links, link => link.id)
      .enter()
      .append('g')
      .attr('class', 'link');

    linksSelection.append('line');
    linksSelection.append('text')
      .attr('dx', 4)
      .attr('dy', 4)
      .text(link => link.name);

    nodesSelection = nodesGroup
      .selectAll('.node')
      .data(nodes, node => node.id)
      .enter()
      .append('g')
      .attr('class', node => `node ${node.kind}`)
      .call(drag);

    nodesSelection.append('circle')
      .attr('r', 7);

    nodesSelection.append('text')
      .attr('dx', 10)
      .attr('dy', 4)
      .text(node => node.name);

    simulation
      .nodes(nodes)
      .on('tick', () => {
        linksSelection
          .selectAll('line')
          .attr('x1', link => link.source.x)
          .attr('y1', link => link.source.y)
          .attr('x2', link => link.target.x)
          .attr('y2', link => link.target.y);

        linksSelection
          .selectAll('text')
          .attr('x', link => (link.source.x + link.target.x) / 2)
          .attr('y', link => (link.source.y + link.target.y) / 2);

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
    this.nId = 0;
    this.oKinds = {
      [RESOURCE_ROLE]: ITEM_ROLE,
      [RESOURCE_CLUSTER_ROLE]: ITEM_CLUSTER_ROLE,
      [RESOURCE_ROLE_BINDING]: ITEM_ROLE_BINDING,
      [RESOURCE_CLUSTER_ROLE_BINDING]: ITEM_CLUSTER_ROLE_BINDING,
    };

    this.oNodes = {};
    this.aLinks = [];

    this.getId = this.getId.bind(this);
    this.getKind = this.getKind.bind(this);
    this.getKey = this.getKey.bind(this);
  }

  getId() {
    return ++this.nId;
  }

  getKind(resource) {
    return this.oKinds[resource];
  }

  getKey(node) {
    const { kind, name } = node;
    return `${kind}:${name}`;
  }

  createNode(node) {
    const { oNodes, getId, getKey } = this;
    const key = getKey(node);
    if (!oNodes[key]) oNodes[key] = { ...node, id: getId() };
    return key;
  }

  createLink(link) {
    const { aLinks, getId } = this;
    aLinks.push({ ...link, id: getId() });
  }

  findNode(node) {
    const { oNodes, getKey } = this;
    const key = getKey(node);
    return oNodes[key] && key;
  }

  getData() {
    const { oNodes, aLinks } = this;

    // nodes
    const oKeyToIndex = {};
    const nodes = Object.keys(oNodes).map((key, index) => {
      oKeyToIndex[key] = index;
      return oNodes[key];
    });

    // links
    const links = aLinks.map(link => ({
      ...link,
      source: oKeyToIndex[link.source],
      target: oKeyToIndex[link.target],
    }));

    //
    return { nodes, links };
  }
}

const selectNamespace = state => state.namespaces[state.namespaceIndex];
const selectItems = state => state.items;
const selectGraphData = createSelector(
  [selectNamespace, selectItems],
  (namespace, items) => {
    const gd = new GraphData();

    // filter namespace
    const itemsNamespace = items.filter(item => {
      const { namespace: itemNamespace = NONAMESPACE } = item.metadata;
      return itemNamespace === namespace;
    });

    // add roles
    itemsNamespace
      .filter(item => {
        const { [RESOURCE]: resource } = item;
        return (
          resource === RESOURCE_ROLE ||
          resource === RESOURCE_CLUSTER_ROLE
        );
      })
      .forEach(item => {
        const { metadata: { name }, [RESOURCE]: resource } = item;
        gd.createNode({ kind: gd.getKind(resource), name });
      });

    // add subjects
    // User, Group, ServiceAccount
    itemsNamespace
      .filter(item => {
        const { [RESOURCE]: resource } = item;
        return (
          resource === RESOURCE_ROLE_BINDING ||
          resource === RESOURCE_CLUSTER_ROLE_BINDING
        );
      })
      .forEach(item => {
        const {
          metadata: { name: itemName },
          subjects,
          roleRef: { kind, name },
        } = item;
        const roleId = gd.findNode({ kind, name });
        roleId && subjects.forEach(subject => {
          const { kind, name } = subject;
          const subjectId = gd.createNode({ kind, name });
          gd.createLink({ name: itemName, source: subjectId, target: roleId });
        });
      });

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
