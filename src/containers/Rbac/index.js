import React from 'react';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Legend from './Graph/Legend';
import Graph from './Graph';
import css from './index.css';

export default class Rbac extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      showLegend: false,
      showIsolated: false,
      showNames: false,
    };
  }

  setShowLegend = showLegend => this.setState({ showLegend });
  setShowIsolated = showIsolated => this.setState({ showIsolated });
  setShowNames = showNames => this.setState({ showNames });

  render() {
    const {
      state: {
        showLegend,
        showIsolated,
        showNames,
      },
      setShowLegend,
      setShowIsolated,
      setShowNames,
    } = this;
    return (
      <div className={css.rbac}>
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Controls
          showLegend={showLegend}
          showIsolated={showIsolated}
          showNames={showNames}
          setShowLegend={setShowLegend}
          setShowIsolated={setShowIsolated}
          setShowNames={setShowNames}
        />
        {
          showLegend &&
          <Legend />
        }
        <Graph
          showIsolated={showIsolated}
          showNames={showNames}
        />
      </div>
    );
  }
}
