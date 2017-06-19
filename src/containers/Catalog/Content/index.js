import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

/*
import {
  itemPost,
  itemDelete,
} from '../../../modules/catalog'
*/

import './index.css';

class Content extends React.Component {
  render() {
    return (
      <div>
        Content
      </div>
    );
  }
}

Content.propTypes = {
  itemPost: PropTypes.func,
  itemDelete: PropTypes.func,
};

export default connect(
  null,
  dispatch => bindActionCreators({
    /*
    itemPost,
    itemDelete,
    */
  }, dispatch),
)(Content);
