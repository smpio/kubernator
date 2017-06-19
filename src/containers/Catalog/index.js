import React from 'react';
import { Helmet } from 'react-helmet';

import Navigation from './Navigation';
import Content from './Content';

import './index.css';

export default class Catalog extends React.PureComponent {
  render() {
    return (
      <div>
        <Helmet>
          <title>Catalog</title>
        </Helmet>
        <Navigation />
        <Content />
      </div>
    );
  }
}
