import React from 'react';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Graph from './Graph';

import {
  NONAMESPACE,
} from '../../modules/rbac';

import './index.css';

export default class Rbac extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { namespace: NONAMESPACE };
    this.setNamespace = this.setNamespace.bind(this);
  }

  setNamespace(namespace) {
    this.setState({ namespace });
  }

  render() {
    const {
      state: {
        namespace,
      },
      setNamespace,
    } = this;

    return (
      <div className="rbac">
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Controls
          namespace={namespace}
          setNamespace={setNamespace}
        />
        <Graph namespace={namespace} />
      </div>
    );
  }
}
