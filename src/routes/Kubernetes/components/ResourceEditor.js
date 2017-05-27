import React from 'react'
import PropTypes from 'prop-types'
import './ResourceEditor.scss'

export const ResourceEditor = ({ resource }) => (
  <div>
    {resource &&
      <code>{JSON.stringify(resource, null, 2)}</code>
    }
  </div>
)

export default ResourceEditor
