import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import {
  deleteActiveObject,
  detachEditor,
  saveObject,
  setObjectYaml,
} from '../../../modules/kubernetes'

import './index.css'

class ObjectEditor extends React.Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (e) {
    this.props.setObjectYaml(e.target.value)
  }

  render () {
    const {
      props: {
        object,
        yaml,
        deleteActiveObject,
        detachEditor,
        saveObject,
      },
      handleChange,
    } = this

    return (
      <div>
        <div className='toolbar'>
          <button onClick={saveObject}>Save</button>
          {
            object &&
            <button onClick={detachEditor}>Detach</button>
          }
          {
            object &&
            <button onClick={deleteActiveObject}>Delete</button>
          }
          {
            object &&
            <span style={{ float: 'right' }}>
              {object.metadata.namespace}/{object.metadata.name} ({object.kind})
            </span>
          }
        </div>
        <textarea
          className='editorArea'
          value={yaml}
          onChange={handleChange}
        />
      </div>
    )
  }
}

ObjectEditor.propTypes = {
  object: PropTypes.object,
  yaml: PropTypes.string.isRequired,
  detachEditor: PropTypes.func.isRequired,
  saveObject: PropTypes.func.isRequired,
  setObjectYaml: PropTypes.func.isRequired,
  deleteActiveObject: PropTypes.func.isRequired,
}

export default connect(
  state => ({
    object: state.editor.activeObject,
    yaml : state.editor.activeObjectYaml,
  }),
  dispatch => bindActionCreators({
    deleteActiveObject,
    detachEditor,
    saveObject,
    setObjectYaml,
  }, dispatch),
)(ObjectEditor)
