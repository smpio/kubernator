import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  tabClose,
} from '../../modules/catalog';

import { Tabs } from 'antd';
import Editor from './Editor';

import classnames from 'classnames';


class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: null,
    };
    this.tabsOnChange = this.tabsOnChange.bind(this);
    this.tabsOnEdit = this.tabsOnEdit.bind(this);
    this.editorOnChange = this.editorOnChange.bind(this);
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

  tabsOnChange(activeKey) {
    this.setState({ activeKey });
  }

  tabsOnEdit(targetKey, action) {
    const { tabClose } = this.props;
    if (action === 'remove') tabClose(targetKey);
    else if (action === 'add') console.log('tabsOnEdit', targetKey, action);
  }

  editorOnChange(value) {
    console.log('Content.onChange', value);
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
      tabsOnChange,
      tabsOnEdit,
      editorOnChange,
    } = this;

    const activeItem = items[activeKey];
    const yaml = activeItem && activeItem.yaml;
    
    return (
      <div
        className={classnames(
          'catalog__content',
          {
            'hide-tabs': !activeKey,
            'hide-editor': !activeItem,
          },
        )}>
        <Tabs
          type="editable-card"
          activeKey={activeKey}
          onChange={tabsOnChange}
          onEdit={tabsOnEdit}
          hideAdd>
          {
            tabs.map(itemUid => {
              const { name } = items[itemUid].metadata;
              return (
                <Tabs.TabPane
                  key={itemUid}
                  tab={name}
                  closable
                />
              );
            })
          }
        </Tabs>
        <Editor
          value={yaml}
          onChange={editorOnChange}
        />
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
