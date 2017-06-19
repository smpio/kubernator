import React from 'react';
import { Helmet } from 'react-helmet';

import Navigation from './Navigation';
import Content from './Content';

import './index.css';

export default class Catalog extends React.PureComponent {
  render() {
    return (
      <div className="catalog">
        <Helmet>
          <title>Catalog</title>
        </Helmet>
        <Navigation className="catalog__navigation" />
        <Content className="catalog__content" />
      </div>
    );
  }
}
