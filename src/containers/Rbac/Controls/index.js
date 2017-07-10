import React from 'react';
import PropTypes from 'prop-types';

import { Checkbox } from 'antd';

import css from './index.css';


export default class Controls extends React.Component {

  static propTypes = {
    showLegend: PropTypes.bool.isRequired,
    showIsolated: PropTypes.bool.isRequired,
    showNamespaces: PropTypes.bool.isRequired,
    setShowLegend: PropTypes.func.isRequired,
    setShowIsolated: PropTypes.func.isRequired,
    setShowNamespaces: PropTypes.func.isRequired,
  };

  static getChecked = event => event.target.checked;

  setShowLegend = event => this.props.setShowLegend(Controls.getChecked(event));
  setShowIsolated = event => this.props.setShowIsolated(Controls.getChecked(event));
  setShowNamespaces = event => this.props.setShowNamespaces(Controls.getChecked(event));

  render() {
    const {
      props: {
        showLegend,
        showIsolated,
        showNamespaces,
      },
      setShowLegend,
      setShowIsolated,
      setShowNamespaces,
    } = this;
    return (
      <div className={css.controls}>
        <Checkbox checked={showLegend} onChange={setShowLegend}>Legend</Checkbox>
        <Checkbox checked={showIsolated} onChange={setShowIsolated}>Isolated</Checkbox>
        <Checkbox checked={showNamespaces} onChange={setShowNamespaces}>Namespaces</Checkbox>
      </div>
    );
  }
}
