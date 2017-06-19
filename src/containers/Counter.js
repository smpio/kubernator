import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Helmet } from 'react-helmet';

import {
  increment,
  incrementAsync,
} from '../modules/counter';

class Counter extends React.Component {
  render() {
    const {
      count,
      increment,
      incrementAsync,
    } = this.props;
    return (
      <div>
        <Helmet>
          <title>Counter</title>
        </Helmet>
        <button onClick={increment}>increment</button>
        <button onClick={incrementAsync}>incrementAsync</button>
        <div>Count: {count}</div>
      </div>
    );
  }
}

Counter.propTypes = {
  count: PropTypes.number,
  increment: PropTypes.func,
  incrementAsync: PropTypes.func,
};

export default connect(
  state => ({
    count: state.counter.count,
  }),
  dispatch => bindActionCreators({
    increment,
    incrementAsync,
  }, dispatch),
)(Counter);
