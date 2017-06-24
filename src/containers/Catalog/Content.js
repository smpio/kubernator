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
      id: null,
      /* id: yaml */
    };

    this.tabsOnChange = this.tabsOnChange.bind(this);
    this.tabsOnEdit = this.tabsOnEdit.bind(this);

    this.onEdit = this.onEdit.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onCloseAll = this.onCloseAll.bind(this);

    this.onDiscard = this.onEdit.bind(this, null);
  }

  shouldComponentUpdate(props) {
    return !props.loading;
  }

  componentWillReceiveProps(props) {
    const { tabs } = props;
    const {
      props: {
        tabs: tabsPrevious,
      },
      state: {
        id,
      },
    } = this;

    if (tabs !== tabsPrevious || !tabs.includes(id)) {
      this.setState({ id: tabs[tabs.length - 1] });
    }
  }

  tabsOnChange(id) {
    this.setState({ id });
  }

  tabsOnEdit(id, action) {
    switch (action) {
      case 'add':
        const {
          state: {
            id: tabId,
            [tabId]: tabYaml,
          },
          props: {
            tabOpen,
            items: {
              [tabId]: {
                [YAML]: itemYaml,
              } = {},
            },
          },
        } = this;
        return tabOpen(
          undefined,
          tabYaml || itemYaml,
          ({ id, yaml }) => this.setState({ id, [id]: yaml }),
        );
      case 'remove':
        const {
          props: {
            tabClose,
          },
        } = this;
        return tabClose(id);
      default:
        return false;
    }
  }

  onEdit(yaml) {
    const { id } = this.state;
    this.setState({ [id]: yaml });
  }

  onSave() {
    const {
      props: {
        items,
        itemPost,
        itemPut,
      },
      state: {
        id,
        [id]: yaml,
      },
    } = this;
    return items[id]
      ? itemPut(id, yaml)
      : itemPost(id, yaml);
  }

  onDelete() {
    const {
      props: {
        itemDelete,
      },
      state: {
        id,
      },
    } = this;
    return itemDelete(id);
  }

  onCloseAll() {
    this.props.tabCloseAll();
  }

  render() {
    const {
      props: {
        loading,
        items,
        tabs,
      },
      state: {
        id,
        [id]: yamlEdited,
      },
      tabsOnChange,
      tabsOnEdit,
      onEdit,
      onSave,
      onDelete,
      onCloseAll,
      onDiscard,
    } = this;

    const item = items[id];
    const yamlOriginal = item && item[YAML];

    const dirty = yamlEdited && yamlEdited !== yamlOriginal;
    const yaml = yamlEdited || yamlOriginal;

    const hideTabs = loading;
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
          activeKey={id}
          onChange={tabsOnChange}
          onEdit={tabsOnEdit}
          tabBarExtraContent={
            <span>
              {
                showCloseAll &&
                <Button
                  className="catalog__button"
                  size="small"
                  onClick={onCloseAll}>
                  CloseAll
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
                dirty &&
                <Button
                  className="catalog__button"
                  size="small"
                  type="primary"
                  onClick={onSave}>
                  Save
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
  state => ({
    loading: state[PREFIX][LOADING], // seems like connect ignores symbols
    ...state[PREFIX],
  }),
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
