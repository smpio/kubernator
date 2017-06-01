import React from 'react'
import { hashHistory, Router } from 'react-router'
import { Provider } from 'react-redux'
import PropTypes from 'prop-types'
import NotificationSystem from 'react-notification-system'

class App extends React.Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    routes: PropTypes.object.isRequired,
  }

  shouldComponentUpdate () {
    return false
  }

  componentDidMount () {
    this.props.store.notificationSystem = this.refs.notificationSystem
  }

  render () {
    return (
      <div>
        <Provider store={this.props.store}>
          <div style={{ height: '100%' }}>
            <Router history={hashHistory} children={this.props.routes} />
          </div>
        </Provider>
        <NotificationSystem ref="notificationSystem" />
      </div>
    )
  }
}

export default App
