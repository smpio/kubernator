import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import throttle from 'react-throttle-render';

import * as d3 from 'd3';

import {
  PREFIX,
  UI_THROTTLE,
  rbacGet,
  tabOpen,
} from '../../../modules/k8s';

import {
  selectGraphData,
} from './selectors';


class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.state = { container: null };
    this.d3State = null; // no need fo rerender

    this.getContainer = this.getContainer.bind(this);
    this.d3Create = this.d3Create.bind(this);
    this.d3Update = this.d3Update.bind(this);

    this.itemEdit = this.itemEdit.bind(this);
  }

  componentDidMount() {
    this.props.rbacGet();
  }

  componentDidUpdate() {
    this.d3Create();
    this.d3Update();
  }

  itemEdit(id) {
    const { historyPush, tabOpen } = this.props;
    historyPush('/catalog');
    setImmediate(() => tabOpen(id));
  }

  getContainer(container) {
    this.setState({ container });
  }

  d3Create() {
    const { container } = this.state;

    // create state
    const d3State = this.d3State = {};

    // get svg
    const svg = d3.select(container);
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
      .force('center', d3.forceCenter(center.x, center.y))
      .force('collide', d3.forceCollide(65 /* r */).strength(0.2 /* def 0.7 */))
      .force('link', d3.forceLink())
      .velocityDecay(0.5);

    // drag
    d3State.drag = d3.drag()
      .on('start', node => {
        if (!d3.event.active) simulation.alphaTarget(0.1).restart();
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
      .scaleExtent([0.2, 2])
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
      itemEdit,
    } = this;

    let nodesSelection;
    let linksSelection;

    linksSelection = linksGroup
      .selectAll('.link')
      .data(links, link => link.id)
      .enter()
      .append('g')
      .attr('class', link => `link ${link.kind}`)
      .on('click', link => itemEdit(link.uid));

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
      .on('click', node => node.uid && itemEdit(node.uid))
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

Graph.propTypes = {
  nodes: PropTypes.array.isRequired,
  links: PropTypes.array.isRequired,
  namespaces: PropTypes.array,
  namespaceIndex: PropTypes.number.isRequired,
  rbacGet: PropTypes.func.isRequired,
  historyPush: PropTypes.func.isRequired,
};

Graph.defaultProps = {
  namespaces: [],
};

export default connect(
  (state, props) => selectGraphData(state[PREFIX], props),
  dispatch => bindActionCreators({
    rbacGet,
    tabOpen,
  }, dispatch),
)(throttle(UI_THROTTLE)(Graph));
