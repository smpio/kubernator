import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Radio } from 'antd';

import {
  PREFIX,
  namespacesGet,
} from '../../modules/rbac';


class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    this.props.namespacesGet();
  }

  onChange(event) {
    const namespace = event.target.value;
    this.props.setNamespace(namespace);
  }

  render() {
    const {
      props: {
        namespaces,
        namespace,
      },
      onChange,
    } = this;
    return (
      <div className="rbac__controls">
        <Radio.Group
          value={namespace}
          onChange={onChange}>
          {
            namespaces.map(ns =>
              <Radio.Button
                key={ns}
                value={ns}
                checked={ns === namespace}>
                {ns}
              </Radio.Button>
            )
          }
        </Radio.Group>
      </div>
    );
  }
}

Controls.propTypes = {
  namespaces: PropTypes.array,
  namespace: PropTypes.string,
  namespacesGet: PropTypes.func,
  setNamespace: PropTypes.func,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    namespacesGet,
  }, dispatch),
)(Controls);
