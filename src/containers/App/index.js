import React from 'react';
import { Link, Switch, Route, Redirect } from 'react-router-dom';
import { Layout, Menu } from 'antd';

import { Catalog, Rbac } from '../';
import PageTitle from './PageTitle';

import logo from './logo.png';
import css from './index.css';

export default props =>
  <Layout className={css.layout}>
    <PageTitle />
    <Layout.Header>
      <Link to="/">
        <img className={css.logo} src={logo} alt="logo" />
      </Link>
      <Menu theme="dark" mode="horizontal">
        <Menu.Item key="catalog">
          <Link to="/catalog">Catalog</Link>
        </Menu.Item>
        <Menu.Item key="rbac">
          <Link to="/rbac">RBAC</Link>
        </Menu.Item>
      </Menu>
    </Layout.Header>
    <Layout.Content>
      <Switch>
        <Route exact path="/catalog" component={Catalog} />
        <Route exact path="/rbac" component={Rbac} />
        <Redirect from="*" to="/catalog" />
      </Switch>
    </Layout.Content>
  </Layout>;
