import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  YAML,
  tabClose,
} from '../../modules/catalog';

import { Tabs, Button } from 'antd';
import Editor from './Editor';

import classnames from 'classnames';


class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: null,
      /* [activeKey]: yaml */
    };
    this.tabsOnChange = this.tabsOnChange.bind(this);
    this.tabsOnEdit = this.tabsOnEdit.bind(this);
    this.tabOnDiscard = this.tabOnDiscard.bind(this);
    this.tabOnSave = this.tabOnSave.bind(this);
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

  tabOnDiscard() {
    const { activeKey } = this.state;
    this.setState({ [activeKey]: null });
  }

  tabOnSave() {
    const {
      props: {
        items,
      },
      state: {
        activeKey,
        [activeKey]: editedYaml,
      },
    } = this;
    const activeItem = items[activeKey];
    console.log('tabOnSave', activeItem, editedYaml);
  }

  editorOnChange(yaml) {
    const { activeKey } = this.state;
    this.setState({ [activeKey]: yaml });
  }

  render() {
    const {
      props: {
        items,
        tabs,
      },
      state: {
        activeKey,
        [activeKey]: editedYaml,
      },
      tabsOnChange,
      tabsOnEdit,
      tabOnDiscard,
      tabOnSave,
      editorOnChange,
    } = this;

    const activeItem = items[activeKey];
    const activeYaml = activeItem && activeItem[YAML];

    const isEdited = editedYaml && editedYaml !== activeYaml;
    const yaml = editedYaml || activeYaml;
    
    return (
      <div
        className={classnames(
          'catalog__content',
          {
            'hide-tabs': !activeKey,
            'hide-editor': !activeYaml,
          },
        )}>
        <Tabs
          type="editable-card"
          activeKey={activeKey}
          onChange={tabsOnChange}
          onEdit={tabsOnEdit}
          hideAdd
          tabBarExtraContent={
            <div>
              {
                isEdited &&
                <Button
                  className="catalog__button"
                  size="small"
                  onClick={tabOnDiscard}>
                  Discard
                </Button>
              }
              {
                isEdited &&
                <Button
                  className="catalog__button"
                  size="small"
                  onClick={tabOnSave}>
                  Save
                </Button>
              }
            </div>
          }>
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
