import React from 'react'
import PropTypes from 'prop-types'
import './ResourceEditor.scss'

export const ResourceEditor = ({ resource, resourceYaml, detach, saveResource }) => (
  <div>
    <div>
      {resource && <button onClick={detach}>Detach resource</button>}
      <button onClick={saveResource}>Save</button>
    </div>
    <pre contentEditable='true' dangerouslySetInnerHTML={{__html: resourceYaml}} />
  </div>
)
ResourceEditor.propTypes = {
  resourceYaml: PropTypes.string.isRequired,
}

export default ResourceEditor
