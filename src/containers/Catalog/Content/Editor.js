import React from 'react';
import PropTypes from 'prop-types';
import MonacoEditor from 'react-monaco-editor';

import css from './index.css';

const PUBLIC_URL = process.env.PUBLIC_URL;
const NOOP = () => {};


export default class Editor extends React.PureComponent {

  static propTypes = {
    value: PropTypes.string,

    onValue: PropTypes.func,
    onCursor: PropTypes.func,
    onScroll: PropTypes.func,

    onSave: PropTypes.func,
    onClose: PropTypes.func,
    onReload: PropTypes.func,
  };

  static defaultProps = {
    value: '',

    onValue: NOOP,
    onCursor: NOOP,
    onScroll: NOOP,

    onSave: NOOP,
    onClose: NOOP,
    onReload: NOOP,
  };

  static requireConfig = {
    // cp node_modules/monaco-editor public/monaco-editor
    url: `${PUBLIC_URL}/monaco-editor/min/vs/loader.js`,
    paths: { 'vs': `${PUBLIC_URL}/monaco-editor/min/vs` },
  };

  static editorOptions = {
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

  static modelOptions = {

    tabSize: 2,
  };


  // init
  // ------

  state = {
    editor: undefined,
    monaco: undefined,
  };

  onMount = (editor, monaco) => {


    // model options
    // ---------------

    editor.getModel()
      .updateOptions(Editor.modelOptions);


    // key bindings
    // --------------

    const {
      onSave,
      onClose,
      onReload,
    } = this;

    const {
      KeyMod: {
        Alt,
        CtrlCmd,
      },
      KeyCode: {
        KEY_S,
        KEY_C,
        KEY_R,
      },
    } = monaco;

    /* eslint-disable no-bitwise */
    editor.addCommand(CtrlCmd | Alt | KEY_S, onSave);
    editor.addCommand(CtrlCmd | Alt | KEY_C, onClose);
    editor.addCommand(CtrlCmd | Alt | KEY_R, onReload);
    /* eslint-enable no-bitwise */


    // cursor and scroll detectors
    // -----------------------------

    const {
      onCursor,
      onScroll,
    } = this.props;

    editor.onDidChangeCursorPosition(cursorChange => {
      /*
        cursorChange is {
          isInEditableRange: Boolean,
          position: {
            lineNumber: Number,
            column: Number,
          },
          reason: Number,
          secondaryPositions: Array,
          secondaryViewPositions: Array,
          source: String,
          viewPosition: {
            lineNumber: Number,
            column: Number,
          },
        }
      */
      const { position } = cursorChange;
      onCursor(position);
    });

    editor.onDidScrollChange(scrollChange => {
      /*
        scrollChange is {
          height: Number,
          heightChanged: Boolean,
          scrollHeight: Number,
          scrollHeightChanged: Boolean,
          scrollLeft: Number,
          scrollLeftChanged: Boolean,
          scrollTop: Number,
          scrollTopChanged: Boolean,
          scrollWidth: Number,
          scrollWidthChanged: Boolean,
          width: Number,
          widthChanged: Boolean,
        }
      */
      const { scrollTop, scrollLeft } = scrollChange;
      onScroll({ scrollTop, scrollLeft });
    });


    //
    // --

    this.setState({ editor, monaco });
  };


  // commands
  // ----------

  onSave = () => {

    this.props.onSave();
  };

  onClose = () => {

    this.props.onClose();
  };

  onReload = () => {

    this.props.onReload();
  };


  // ui
  // ----

  setCursorPosition = cursorPosition => {
    /*
      cursorPosition is {
        lineNumber: Number,
        column: Number,
      }
    */
    const { editor } = this.state;
    if (editor) editor.setPosition(cursorPosition);
  };

  setScrollPosition = scrollPosition => {
    /*
      scrollPosition is {
        scrollTop: Number,
        scrollLeft: Number,
      }
    */
    const { editor } = this.state;
    if (editor) editor.setScrollPosition(scrollPosition);
  };

  setFocus = () => {
    const { editor } = this.state;
    if (editor) editor.focus();
  };

  render() {

    const {
      props: {
        value = '',
        onValue,
      },
      onMount,
      setFocus,
    } = this;

    setTimeout(setFocus);
    return (
      <div className={css.editor}>
        <MonacoEditor
          requireConfig={Editor.requireConfig}
          options={Editor.editorOptions}
          editorDidMount={onMount}
          width="auto"
          height="auto"
          language="yaml"
          value={value}
          onChange={onValue}
        />
      </div>
    );
  }
}
