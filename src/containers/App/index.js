import React from 'react'
import { Route, Link } from 'react-router-dom'

import {
  Home,
  Kubernetes,
  Counter,
} from '../'

import 'sanitize.css/sanitize.css'
import './index.css'

export default props =>
  <div>
    <header>
      <Link to='/'>Home</Link>
      <Link to='/kubernetes'>Kubernetes</Link>
      <Link to='/counter'>Counter</Link>
    </header>
    <main>
      <Route exact path='/' component={Home} />
      <Route exact path='/kubernetes' component={Kubernetes} />
      <Route exact path='/counter' component={Counter} />
    </main>
  </div>
