import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import Navigation from './Navigation';
import Content from './Content';
import css from './index.css';


export default class Catalog extends React.PureComponent {

  static propTypes = {
    location: PropTypes.object.isRequired,
  };

  render() {
    const item = this.props.location.state;
    return (
      <div className={css.catalog}>
        <Helmet>
          <title>Catalog</title>
        </Helmet>
        <Navigation />
        <Content defaultItem={item} />
      </div>
    );
  }
}
