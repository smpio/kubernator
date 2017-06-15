import React from 'react'
import { Route, Link } from 'react-router-dom'

import Home from '../Home'
import Kubernetes from '../Kubernetes'

const App = () => (
  <div>
    <header>
      <Link to='/'>Home</Link>
      <Link to='/kubernetes'>Kubernetes</Link>
    </header>

    <main>
      <Route exact path='/' component={Home} />
      <Route exact path='/kubernetes' component={Kubernetes} />
    </main>
  </div>
)

export default App
