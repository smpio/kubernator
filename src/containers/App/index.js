import React from 'react'
import { Route, Link } from 'react-router-dom'

import {
  Home,
  Kubernetes,
  Counter,
} from '../'

import {
  Layout,
  Menu,
} from 'antd'

import logo from './logo.png'
import './index.css'

export default props =>
  <Layout className='layout'>
    <Layout.Header>
      <img className='logo' src={logo} />
      <Menu className='menu' theme='dark' mode='horizontal'>
        <Menu.Item key='home'>
          <Link to='/'>Home</Link>
        </Menu.Item>
        <Menu.Item key='kubernetes'>
          <Link to='/kubernetes'>Kubernetes</Link>
        </Menu.Item>
        <Menu.Item key='counter'>
          <Link to='/counter'>Counter</Link>
        </Menu.Item>
      </Menu>
    </Layout.Header>
    <Layout.Content className='content'>
      <div className='canvas'>
        <Route exact path='/' component={Home} />
        <Route exact path='/kubernetes' component={Kubernetes} />
        <Route exact path='/counter' component={Counter} />
      </div>
    </Layout.Content>
  </Layout>
