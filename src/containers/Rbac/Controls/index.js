import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Radio, Checkbox, Spin } from 'antd';

import {
  PREFIX,
  namespacesGet,
} from '../../../modules/k8s';


class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeNamespace = this.onChangeNamespace.bind(this);
    this.onChangeLegend = this.onChangeLegend.bind(this);
  }

  componentDidMount() {
    this.props.namespacesGet();
  }

  onChangeNamespace(event) {
    const namespaceIndex = event.target.value;
    this.props.onChangeNamespace(namespaceIndex);
  }

  onChangeLegend(event) {
    const value = event.target.checked;
    this.props.onChangeLegend(value);
  }

  render() {
    const {
      props: {
        namespaces,
        namespaceIndex,
      },
      onChangeNamespace,
      onChangeLegend,
    } = this;
    return (
      <div className="rbac__controls">
        <div className="rbac__controls-inner">
          {
            !namespaces.length &&
            <Spin />
          }
          <Radio.Group
            value={namespaceIndex}
            onChange={onChangeNamespace}>
            {
              namespaces.map((namespace, index) =>
                <Radio.Button
                  key={namespace}
                  value={index}
                  checked={index === namespaceIndex}>
                  {namespace}
                </Radio.Button>
              )
            }
          </Radio.Group>
          <div className="rbac__controls-legend">
            <Checkbox onChange={onChangeLegend}>Legend</Checkbox>
          </div>
        </div>
      </div>
    );
  }
}

Controls.propTypes = {
  namespaces: PropTypes.array.isRequired,
  namespacesGet: PropTypes.func.isRequired,
  namespaceIndex: PropTypes.number.isRequired,
  onChangeLegend: PropTypes.func.isRequired,
  onChangeNamespace: PropTypes.func.isRequired,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    namespacesGet,
  }, dispatch),
)(Controls);
