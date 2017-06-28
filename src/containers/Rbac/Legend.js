import React from 'react';

export default class Legend extends React.PureComponent {
  render() {
    return (
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
    );
  }
}
