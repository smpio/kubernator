import React from 'react'
import PropTypes from 'prop-types'
import './ResourceEditor.scss'

export const ResourceEditor = ({ resourceYaml }) => (
  <div>
    {resourceYaml &&
      <pre>{resourceYaml}</pre>
    }
  </div>
)

export default ResourceEditor
