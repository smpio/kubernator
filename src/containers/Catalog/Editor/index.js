import React from 'react';
import PropTypes from 'prop-types';
import MonacoEditor from 'react-monaco-editor';

const PUBLIC_URL = process.env.PUBLIC_URL;


export default class Editor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      editor: null,
      monaco: null,
    };
    this.editorDidMount = this.editorDidMount.bind(this);
  }

  editorDidMount(editor, monaco) {
    this.setState({ editor, monaco });
  }

  render() {
    const {
      props: {
        value = '',
        onChange,
      },
      editorDidMount,
    } = this;
    return (
      <div className="react-monaco-editor">
        <MonacoEditor
          requireConfig={Editor.requireConfig}
          options={Editor.options}
          width="auto"
          height="auto"
          language="yaml"
          value={value}
          onChange={onChange}
          editorDidMount={editorDidMount}
        />
      </div>
    );
  }
}

Editor.requireConfig = {
  // cp node_modules/monaco-editor public/monaco-editor
  url: `${PUBLIC_URL}/monaco-editor/min/vs/loader.js`,
  paths: { 'vs': `${PUBLIC_URL}/monaco-editor/min/vs` },
};

Editor.options = {
  // https://github.com/Microsoft/monaco-editor/blob/master/website/playground/monaco.d.ts.txt#L1103
  folding: true,
  wordWrap: true,
  wrappingIndent: 'same',
  lineNumbersMinChars: 3,
  scrollBeyondLastLine: false,
  //renderWhitespace: 'boundary',
  //renderIndentGuides: true,
  //readOnly: false,
  automaticLayout: true,
};

Editor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};

Editor.defaultProps = {
  value: '',
  onChange: () => {},
};
