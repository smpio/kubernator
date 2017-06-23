import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import {
  PREFIX,
  YAML,
  LOADING,
  itemGet,
  itemPost,
  itemPut,
  itemDelete,
  tabOpen,
  tabClose,
  tabCloseAll,
} from '../../modules/catalog';

import { Tabs, Button } from 'antd';
import Editor from './Editor';

import classnames from 'classnames';


class Content extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      uid: null,
      /* uid: yaml */
    };

    this.tabsOnChange = this.tabsOnChange.bind(this);
    this.tabsOnEdit = this.tabsOnEdit.bind(this);

    this.onEdit = this.onEdit.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onCloseAll = this.onCloseAll.bind(this);

    this.onDiscard = this.onEdit.bind(this, null);
  }

  shouldComponentUpdate() {
    return !this.props[LOADING];
  }

  componentWillReceiveProps(props) {
    const { tabs } = props;
    const {
      props: {
        tabs: tabsPrevious,
      },
      state: {
        uid,
      },
    } = this;

    if (tabs !== tabsPrevious || !tabs.includes(uid)) {
      this.setState({ uid: tabs[tabs.length - 1] });
    }
  }

  tabsOnChange(uid) {
    this.setState({ uid });
  }

  tabsOnEdit(uid, action) {
    const { tabOpen, tabClose } = this.props;
    switch (action) {
      case 'add': return tabOpen();
      case 'remove': return tabClose(uid);
      default: return false;
    }
  }

  onEdit(yaml) {
    const { uid } = this.state;
    this.setState({ [uid]: yaml });
  }

  onSave() {
    const {
      props: {
        items,
        itemPost,
        itemPut,
      },
      state: {
        uid,
        [uid]: yaml,
      },
    } = this;
    return items[uid]
      ? itemPut(uid, yaml)
      : itemPost(uid, yaml);
  }

  onDelete() {
    const {
      props: {
        itemDelete,
      },
      state: {
        uid,
      },
    } = this;
    return itemDelete(uid);
  }

  onCloseAll() {
    this.props.tabCloseAll();
  }

  render() {
    const {
      props: {
        items,
        tabs,
      },
      state: {
        uid,
        [uid]: yamlEdited,
      },
      tabsOnChange,
      tabsOnEdit,
      onEdit,
      onSave,
      onDelete,
      onCloseAll,
      onDiscard,
    } = this;

    const item = items[uid];
    const yamlOriginal = item && item[YAML];

    const dirty = yamlEdited && yamlEdited !== yamlOriginal;
    const yaml = yamlEdited || yamlOriginal;

    const hideTabs = false;
    const hideEditor = !tabs.length;

    const showCloseAll = !!tabs.length;

    return (
      <div
        className={classnames(
          'catalog__content',
          {
            'hide-tabs': hideTabs,
            'hide-editor': hideEditor,
          },
        )}>
        <Tabs
          type="editable-card"
          activeKey={uid}
          onChange={tabsOnChange}
          onEdit={tabsOnEdit}
          tabBarExtraContent={
            <span>
              {
                dirty &&
                <Button
                  className="catalog__button"
                  size="small"
                  type="primary"
                  onClick={onSave}>
                  Save
                </Button>
              }
              {
                dirty &&
                <Button
                  className="catalog__button"
                  size="small"
                  onClick={onDiscard}>
                  Discard
                </Button>
              }
              {
                item &&
                <Button
                  className="catalog__button"
                  size="small"
                  type="danger"
                  onClick={onDelete}>
                  Delete
                </Button>
              }
              {
                showCloseAll &&
                <Button
                  className="catalog__button"
                  size="small"
                  onClick={onCloseAll}>
                  CloseAll
                </Button>
              }
            </span>
          }>
          {
            tabs.map(itemUid => {
              const {
                metadata: {
                  name = itemUid,
                } = {},
              } = items[itemUid] || {};
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
          onChange={onEdit}
        />
      </div>
    );
  }
}

Content.propTypes = {
  [LOADING]: PropTypes.string,
  items: PropTypes.object,
  tabs: PropTypes.array,
  itemGet: PropTypes.func,
  itemPost: PropTypes.func,
  itemPut: PropTypes.func,
  itemDelete: PropTypes.func,
  tabOpen: PropTypes.func,
  tabClose: PropTypes.func,
  tabCloseAll: PropTypes.func,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    itemGet,
    itemPost,
    itemPut,
    itemDelete,
    tabOpen,
    tabClose,
    tabCloseAll,
  }, dispatch),
)(Content);
