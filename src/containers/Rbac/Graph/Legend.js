import React from 'react';
import classnames from 'classnames';
import css from './index.css';

export default class Legend extends React.PureComponent {
  render() {
    return (
      <div className={css.legend}>
        <svg height="20">
          <g transform="translate(10,10)">
            <g className={classnames(css.node, 'User')} transform="translate(0,0)">
              <circle r="7" />
              <text dx="12" dy="4">User</text>
            </g>
            <g className={classnames(css.node, 'Group')} transform="translate(65,0)">
              <circle r="7" />
              <text dx="12" dy="4">Group</text>
            </g>
            <g className={classnames(css.node, 'ServiceAccount')} transform="translate(140,0)">
              <circle r="7" />
              <text dx="12" dy="4">ServiceAccount</text>
            </g>
          </g>
          <g transform="translate(310,10)">
            <g className={classnames(css.node, 'Role')} transform="translate(0,0)">
              <circle r="7" />
              <text dx="12" dy="4">Role</text>
            </g>
            <g className={classnames(css.node, 'ClusterRole')} transform="translate(65,0)">
              <circle r="7" />
              <text dx="12" dy="4">ClusterRole</text>
            </g>
          </g>
          <g transform="translate(500,10)">
            <g className={classnames(css.link, 'RoleBinding')} transform="translate(0,0)">
              <line x1="0" y1="0" x2="20" y2="0"></line>
              <text dx="28" dy="4">RoleBinding</text>
            </g>
            <g className={classnames(css.link, 'ClusterRoleBinding')} transform="translate(120,0)">
              <line x1="0" y1="0" x2="20" y2="0"></line>
              <text dx="28" dy="4">ClusterRoleBinding</text>
            </g>
          </g>
        </svg>
      </div>
    );
  }
}
