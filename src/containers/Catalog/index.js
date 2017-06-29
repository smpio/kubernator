import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import Navigation from './Navigation';
import Content from './Content';

import './index.css';

export default class Catalog extends React.PureComponent {
  render() {
    const item = this.props.location.state;
    return (
      <div className="catalog">
        <Helmet>
          <title>Catalog</title>
        </Helmet>
        <Navigation />
        <Content defaultItem={item} />
      </div>
    );
  }
}

Catalog.propTypes = {
  location: PropTypes.object,
};
