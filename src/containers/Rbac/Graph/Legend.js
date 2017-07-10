import React from 'react';

import classnames from 'classnames';
import css from './index.css';

export default class Legend extends React.PureComponent {
  render() {
    return (
      <div className={css.legend}>
        <svg height="20">
          <g className={classnames(css.node, 'User')} transform="translate(10,10)">
            <circle r="7" />
            <text dx="12" dy="4">User, Group, ServiceAccount</text>
          </g>
          <g className={classnames(css.node, 'Role')} transform="translate(220,10)">
            <circle r="7" />
            <text dx="12" dy="4">Role, ClusterRole</text>
          </g>
          <g className={classnames(css.link, 'RoleBinding')} transform="translate(355,10)">
            <line x1="0" y1="0" x2="20" y2="0"></line>
            <text dx="28" dy="4">RoleBinding, ClusterRoleBinding</text>
          </g>
        </svg>
      </div>
    );
  }
}
