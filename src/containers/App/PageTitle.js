import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';

import {
  PREFIX,
} from 'modules/k8s';

@connect(state => state[PREFIX].basic)
export default class PageTitle extends React.Component {

  static propTypes = {
    appInfo: PropTypes.shape({
      version: PropTypes.string.isRequired,
    }),
    apiInfo: PropTypes.shape({
      gitVersion: PropTypes.string.isRequired,
    }),
  };

  render() {
    const {
      apiInfo: { gitVersion: apiVersion } = {},
    } = this.props;

    return (
      <Helmet>
        <title>
          Kubernator
          {apiVersion ? ` | API ${apiVersion}` : ''}
        </title>
      </Helmet>
    );
  }
}
