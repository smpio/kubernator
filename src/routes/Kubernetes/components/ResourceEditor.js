import React from 'react'
import PropTypes from 'prop-types'
import './ResourceEditor.scss'

export const ResourceEditor = ({ resource }) => (
  <div>
    {resource &&
      <pre>{JSON.stringify(resource, null, 2)}</pre>
    }
  </div>
)

export default ResourceEditor
