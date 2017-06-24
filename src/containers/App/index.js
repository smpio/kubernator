import React from 'react';
import { Link, Route, Redirect } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import {
  Catalog,
  Legacy,
} from '../';

import {
  Layout,
  Menu,
} from 'antd';

import logo from './logo.png';
import './index.css';

export default props =>
  <Layout className="layout">
    <Helmet>
      <title>App</title>
    </Helmet>
    <Layout.Header>
      <Link to="/">
        <img className="layout__logo" src={logo} alt="logo" />
      </Link>
      <Menu theme="dark" mode="horizontal">
        <Menu.Item key="catalog">
          <Link to="/catalog">Catalog</Link>
        </Menu.Item>
        <Menu.Item key="legacy">
          <Link to="/legacy">Legacy</Link>
        </Menu.Item>
      </Menu>
    </Layout.Header>
    <Layout.Content>
      <Route exact path="/catalog" component={Catalog} />
      <Route exact path="/legacy" component={Legacy} />
      <Redirect from="*" to="/catalog" />
    </Layout.Content>
  </Layout>;
