import React from 'react';
import { Helmet } from 'react-helmet';

import Graph from './Graph';

import './index.css';

export default class Rbac extends React.PureComponent {
  render() {
    return (
      <div className="rbac">
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Graph />
      </div>
    );
  }
}
