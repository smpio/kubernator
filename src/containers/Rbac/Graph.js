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

const getId = (function() {
  let id = 0;
  return () => ++id;
})();

const selectItems = state => state.items;
const selectGraph = createSelector(
  selectItems,
  items => {
    const result = { nodes: {}, links: {} };
    const { nodes, links } = result;
    items.forEach(item => {
      const {
        metadata: {
          namespace,
          name,
        },
        [RESOURCE]: resource,
      } = item;

      // root
      const rootId = getId();
      nodes[rootId] = {
        id: rootId,
        name: `${namespace}:${name}`,
      };

      // children
      switch (resource) {

        case RESOURCE_ROLE:
        case RESOURCE_CLUSTER_ROLE:
          item.rules.forEach(rule => {

            // rule
            const ruleId = getId();
            nodes[ruleId] = {
              id: ruleId,
              name: '',
            };

            // link
            const linkId = getId();
            links[linkId] = {
              id: linkId,
              source: rootId,
              target: ruleId,
            };

            // children
            // apiGroups, resources, verbs, etc.
            Object.keys(rule).forEach(key => {
              const values = rule[key];

              // key
              const keyId = getId();
              nodes[keyId] = {
                id: keyId,
                name: key,
              };

              // link
              const linkId = getId();
              links[linkId] = {
                id: linkId,
                source: ruleId,
                target: keyId,
              };

              // children
              values.forEach(value => {

                // value
                const valueId = getId();
                nodes[valueId] = {
                  id: valueId,
                  name: value,
                };

                // link
                const linkId = getId();
                links[linkId] = {
                  id: linkId,
                  source: keyId,
                  target: valueId,
                };
              });
            });
          });
          break;

        case RESOURCE_ROLE_BINDING:
        case RESOURCE_CLUSTER_ROLE_BINDING:
          item.subjects.forEach(subject => {
            const { kind, name } = subject;

            // subject
            const subjectId = getId();
            nodes[subjectId] = {
              id: subjectId,
              name: `${kind}:${name}`,
            };

            // link
            const linkId = getId();
            links[linkId] = {
              id: linkId,
              source: rootId,
              target: subjectId,
            };
          });
          break;
      }
    });
    return result;
  },
);


// connect
// ---------

Graph.propTypes = {
  nodes: PropTypes.object,
  links: PropTypes.object,
  itemsGet: PropTypes.func,
};

export default connect(
  state => selectGraph(state[PREFIX]),
  dispatch => bindActionCreators({
    itemsGet,
  }, dispatch),
)(Graph);
