import React from 'react';
import PropTypes from 'prop-types';

import { Checkbox } from 'antd';

import css from './index.css';


export default class Controls extends React.Component {

  static propTypes = {
    showLegend: PropTypes.bool.isRequired,
    showIsolated: PropTypes.bool.isRequired,
    showNames: PropTypes.bool.isRequired,
    setShowLegend: PropTypes.func.isRequired,
    setShowIsolated: PropTypes.func.isRequired,
    setShowNames: PropTypes.func.isRequired,
  };

  static getChecked = event => event.target.checked;

  setShowLegend = event => this.props.setShowLegend(Controls.getChecked(event));
  setShowIsolated = event => this.props.setShowIsolated(Controls.getChecked(event));
  setShowNames = event => this.props.setShowNames(Controls.getChecked(event));

  render() {
    const {
      props: {
        showLegend,
        showIsolated,
        showNames,
      },
      setShowLegend,
      setShowIsolated,
      setShowNames,
    } = this;
    return (
      <div className={css.controls}>
        <Checkbox checked={showLegend} onChange={setShowLegend}>Legend</Checkbox>
        <Checkbox checked={showIsolated} onChange={setShowIsolated}>Isolated</Checkbox>
        <Checkbox checked={showNames} onChange={setShowNames}>Names</Checkbox>
      </div>
    );
  }
}
