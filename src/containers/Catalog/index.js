import React from 'react';

import Navigation from './Navigation';
import Content from './Content';
import css from './index.css';

export default class Catalog extends React.PureComponent {
  render() {
    return (
      <div className={css.catalog}>
        <Navigation />
        <Content />
      </div>
    );
  }
}
