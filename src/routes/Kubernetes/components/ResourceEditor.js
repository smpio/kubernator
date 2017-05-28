import React from 'react'
import PropTypes from 'prop-types'
import './ResourceEditor.scss'

export class ResourceEditor extends React.Component {
  static propTypes = {
    resource: PropTypes.object.isRequired,
    resourceYaml: PropTypes.string.isRequired,
    detachEditor: PropTypes.func.isRequired,
    saveResource: PropTypes.func.isRequired,
    setResourceYaml: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    this.props.setResourceYaml(e.target.value)
  }

  render () {
    let { resource, resourceYaml, detachEditor, saveResource } = this.props
    return (
      <div>
        <div className='toolbar'>
          {resource && <button onClick={detachEditor}>Detach resource</button>}
          <button onClick={saveResource}>Save</button>
        </div>
        <textarea className='editorArea' value={resourceYaml} onChange={this.handleChange} />
      </div>
    )
  }
}

export default ResourceEditor
