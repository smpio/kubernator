import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  tabClose,
} from '../../modules/catalog';

import { Tabs } from 'antd';
const TabPane = Tabs.TabPane;

class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: null,
    };
    this.onChange = this.onChange.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }

  componentWillReceiveProps(props) {
    const { tabs } = props;
    const {
      props: {
        tabs: tabsPrevious,
      },
      state: {
        activeKey,
      },
    } = this;

    if (tabs !== tabsPrevious || !tabs.includes(activeKey)) {
      this.setState({ activeKey: tabs[tabs.length - 1] });
    }
  }

  onChange(activeKey) {
    this.setState({ activeKey });
  }

  onEdit(targetKey, action) {
    const { tabClose } = this.props;
    switch (action) {
      case 'add':
        break;
      case 'remove':
        tabClose(targetKey);
        break;
    }
  }

  render() {
    const {
      props: {
        items,
        tabs,
      },
      state: {
        activeKey,
      },
      onChange,
      onEdit,
    } = this;
    
    return (
      <div className="catalog__content">
        <h2>Content</h2>
        <Tabs
          type="editable-card"
          activeKey={activeKey}
          onChange={onChange}
          onEdit={onEdit}>
          {
            tabs.map(itemUid => {
              const { metadata: { name }, yaml } = items[itemUid];
              return (
                <TabPane
                  key={itemUid}
                  tab={name}
                  closable>
                  {yaml}
                </TabPane>
              );
            })
          }
        </Tabs>
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
