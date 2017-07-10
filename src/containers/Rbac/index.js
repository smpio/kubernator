import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Graph from './Graph';
import Legend from './Graph/Legend';
import css from './index.css';

export default class Rbac extends React.PureComponent {

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      showLegend: false,
      namespaceIndex: 0,
    };
  }

  onChangeLegend = showLegend => {
    this.setState({ showLegend });
  };

  onChangeNamespace = namespaceIndex => {
    this.setState({ namespaceIndex });
  };

  historyPush = url => {
    this.props.history.push(url);
  };

  render() {
    const {
      state: {
        showLegend,
        namespaceIndex,
      },
      onChangeLegend,
      onChangeNamespace,
      historyPush,
    } = this;
    return (
      <div className={css.rbac}>
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Controls
          namespaceIndex={namespaceIndex}
          onChangeNamespace={onChangeNamespace}
          onChangeLegend={onChangeLegend}
        />
        {
          showLegend &&
          <Legend />
        }
        <Graph
          namespaceIndex={namespaceIndex}
          historyPush={historyPush}
        />
      </div>
    );
  }
}
