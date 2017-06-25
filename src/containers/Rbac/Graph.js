import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  rbacGet,
} from '../../modules/rbac';


class Graph extends React.Component {

  componentDidMount() {
    this.props.rbacGet();
  }

  render() {
    return (
      <div>
        Graph
      </div>
    );
  }
}

Graph.propTypes = {
  roles: PropTypes.object,
  bindings: PropTypes.object,
  rbacGet: PropTypes.func,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    rbacGet,
  }, dispatch),
)(Graph);
