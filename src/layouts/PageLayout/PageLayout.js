import React from 'react'
import { IndexLink, Link } from 'react-router'
import PropTypes from 'prop-types'
import './PageLayout.scss'

export const PageLayout = ({ children }) => children
PageLayout.propTypes = {
  children: PropTypes.node,
}

export default PageLayout
