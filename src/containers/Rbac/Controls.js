import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Radio } from 'antd';

import {
  PREFIX,
  namespacesGet,
  namespaceSet,
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
    const namespaceIndex = event.target.value;
    this.props.namespaceSet(namespaceIndex);
  }

  render() {
    const {
      props: {
        namespaces,
        namespaceIndex,
      },
      onChange,
    } = this;
    return (
      <div className="rbac__controls">
        <div className="rbac__controls-inner">
          <Radio.Group
            value={namespaceIndex}
            onChange={onChange}>
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
        </div>
        <div className="rbac__legend">
          <svg height="20">
            <g className="node Role" transform="translate(10,10)">
              <circle r="7" />
              <text dx="12" dy="4">Role, ClusterRole</text>
            </g>
            <g className="node User" transform="translate(150,10)">
              <circle r="7" />
              <text dx="12" dy="4">User, Group, ServiceAccount</text>
            </g>
            <g className="node key" transform="translate(355,10)">
              <circle r="7" />
              <text dx="12" dy="4">RoleBinding, ClusterRoleBinding, key</text>
            </g>
            <g className="node value" transform="translate(605,10)">
              <circle r="7" />
              <text dx="12" dy="4">value</text>
            </g>
          </svg>
        </div>
      </div>
    );
  }
}

Controls.propTypes = {
  namespaces: PropTypes.array,
  namespaceIndex: PropTypes.number,
  namespacesGet: PropTypes.func,
  namespaceSet: PropTypes.func,
};

export default connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    namespacesGet,
    namespaceSet,
  }, dispatch),
)(Controls);
