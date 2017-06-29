import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Legend from './Legend';
import Graph from './Graph';

import './index.css';

export default class Rbac extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showLegend: false,
      namespaceIndex: 0,
    };
    this.onChangeLegend = this.onChangeLegend.bind(this);
    this.onChangeNamespace = this.onChangeNamespace.bind(this);
    this.historyPush = this.historyPush.bind(this);
  }

  onChangeLegend(showLegend) {
    this.setState({ showLegend });
  }

  onChangeNamespace(namespaceIndex) {
    this.setState({ namespaceIndex });
  }

  historyPush(url) {
    return this.props.history.push(url);
  }

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
      <div className="rbac">
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

Rbac.propTypes = {
  history: PropTypes.object,
};
