import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Legend from './Graph/Legend';
import Graph from './Graph';
import css from './index.css';

export default class Rbac extends React.PureComponent {

  static propTypes = {
    history: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      showLegend: false,
      showIsolated: false,
      showNamespaces: false,
    };
  }

  setShowLegend = showLegend => this.setState({ showLegend });
  setShowIsolated = showIsolated => this.setState({ showIsolated });
  setShowNamespaces = showNamespaces => this.setState({ showNamespaces });

  navigateTo = url => this.props.history.push(url);

  render() {
    const {
      state: {
        showLegend,
        showIsolated,
        showNamespaces,
      },
      setShowLegend,
      setShowIsolated,
      setShowNamespaces,
      navigateTo,
    } = this;
    return (
      <div className={css.rbac}>
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Controls
          showLegend={showLegend}
          showIsolated={showIsolated}
          showNamespaces={showNamespaces}
          setShowLegend={setShowLegend}
          setShowIsolated={setShowIsolated}
          setShowNamespaces={setShowNamespaces}
        />
        {
          showLegend &&
          <Legend />
        }
        <Graph
          showIsolated={showIsolated}
          showNamespaces={showNamespaces}
          navigateTo={navigateTo}
        />
      </div>
    );
  }
}
