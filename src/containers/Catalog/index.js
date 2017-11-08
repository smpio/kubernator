import React from 'react';
import { Helmet } from 'react-helmet';

import Navigation from './Navigation';
import Content from './Content';
import css from './index.css';

export default class Catalog extends React.PureComponent {
  render() {
    return (
      <div className={css.catalog}>
        <Helmet>
          <title>Catalog</title>
        </Helmet>
        <Navigation />
        <Content />
      </div>
    );
  }
}
