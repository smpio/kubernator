import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  tabClose,
} from '../../modules/catalog';

class Content extends React.Component {
  render() {
    const {
      items,
      tabs,
      tabClose,
    } = this.props;
    
    return (
      <div className="content">
        <h2>Content</h2>
        {
          tabs.map(itemUid =>
            <div key={itemUid}>
              <div onClick={() => tabClose(itemUid)}>{itemUid}</div>
              <div>{items[itemUid].yaml}</div>
            </div>
          )
        }
      </div>
    );
  }
}

Content.propTypes = {
  items: PropTypes.object,
  tabs: PropTypes.array,
  tabClose: PropTypes.func,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    tabClose,
  }, dispatch),
)(Content);
