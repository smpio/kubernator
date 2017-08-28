import React from 'react';
import PropTypes from 'prop-types';
import MonacoEditor from 'react-monaco-editor';

import css from './index.css';

const PUBLIC_URL = process.env.PUBLIC_URL;


export default class Editor extends React.PureComponent {

  static propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    onSave: PropTypes.func,
    onClose: PropTypes.func,
    onReload: PropTypes.func,
  };

  static defaultProps = {
    value: '',
    onChange: () => {},
    onSave: () => {},
    onClose: () => {},
    onReload: () => {},
  };

  static requireConfig = {
    // cp node_modules/monaco-editor public/monaco-editor
    url: `${PUBLIC_URL}/monaco-editor/min/vs/loader.js`,
    paths: { 'vs': `${PUBLIC_URL}/monaco-editor/min/vs` },
  };

  static options = {
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

  static KeyCode = {
    Ctrl: 256,
    Alt: 512,
    Shift: 1024,
    Meta: 2048,
  };

  constructor(props) {
    super(props);
    this.state = {
      editor: null,
      monaco: null,
    };
  }

  onSave = () => {
    this.props.onSave();
  };

  onClose = () => {
    this.props.onClose();
  };

  onReload = () => {
    this.props.onReload();
  };

  editorDidMount = (editor, monaco) => {
    const { onSave, onClose, onReload } = this;
    const { Meta, Alt } = Editor.KeyCode;
    const { KEY_S, KEY_C, KEY_R } = monaco.KeyCode;
    /* eslint-disable no-bitwise */
    editor.addCommand(Meta | Alt | KEY_S, onSave);
    editor.addCommand(Meta | Alt | KEY_C, onClose);
    editor.addCommand(Meta | Alt | KEY_R, onReload);
    /* eslint-enable no-bitwise */
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
      <div className={css.editor}>
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
