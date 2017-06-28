import React from 'react';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Legend from './Legend';
import Graph from './Graph';

import './index.css';

export default class Rbac extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { showLegend: false };
    this.onChangeLegend = this.onChangeLegend.bind(this);
  }

  onChangeLegend(showLegend) {
    this.setState({ showLegend });
  }

  render() {
    const {
      state: {
        showLegend,
      },
      onChangeLegend,
    } = this;
    return (
      <div className="rbac">
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Controls
          onChangeLegend={onChangeLegend}
        />
        {
          showLegend &&
          <Legend />
        }
        <Graph />
      </div>
    );
  }
}
