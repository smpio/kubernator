import React from 'react';
import PropTypes from 'prop-types';
import MonacoEditor from 'react-monaco-editor';

const PUBLIC_URL = process.env.PUBLIC_URL;


export default class Editor extends React.PureComponent {
  render() {
    const {
      value = '',
      onChange,
    } = this.props;
    return (
      <MonacoEditor
        requireConfig={Editor.requireConfig}
        options={Editor.options}
        language="yaml"
        value={value}
        onChange={onChange}
      />
    );
  }
}

Editor.requireConfig = {
  // cp node_modules/monaco-editor public/monaco-editor
  url: `${PUBLIC_URL}/monaco-editor/min/vs/loader.js`,
  paths: { 'vs': `${PUBLIC_URL}/monaco-editor/min/vs` },
};

Editor.defaultOptions = {
  folding: true,
  wordWrap: true,
  wrappingIndent: 'same',
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  //renderWhitespace: 'boundary',
  //renderIndentGuides: true,
  //readOnly: false,
};

Editor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};
