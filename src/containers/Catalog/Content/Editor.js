import React from 'react';
import PropTypes from 'prop-types';
import MonacoEditor from 'react-monaco-editor/lib/diff';

import css from './index.css';

const PUBLIC_URL = process.env.PUBLIC_URL;
const NOOP = () => {};


export default class Editor extends React.PureComponent {

  static propTypes = {
    original: PropTypes.string,
    value: PropTypes.string,

    onValue: PropTypes.func,
    onCursor: PropTypes.func,
    onScroll: PropTypes.func,

    onSave: PropTypes.func,
    onClose: PropTypes.func,
    onReload: PropTypes.func,

    onSwitchLeft: PropTypes.func,
    onSwitchRight: PropTypes.func,
  };

  static defaultProps = {
    value: '',

    onValue: NOOP,
    onCursor: NOOP,
    onScroll: NOOP,

    onSave: NOOP,
    onClose: NOOP,
    onReload: NOOP,

    onSwitchLeft: NOOP,
    onSwitchRight: NOOP,
  };

  static optionsRequire = {
    // cp node_modules/monaco-editor public/monaco-editor
    url: `${PUBLIC_URL}/monaco-editor/min/vs/loader.js`,
    paths: { 'vs': `${PUBLIC_URL}/monaco-editor/min/vs` },
  };

  static optionsEditor = {
    // https://github.com/Microsoft/monaco-editor/blob/master/website/playground/monaco.d.ts.txt#L1103

    // simple
    folding: true,
    wordWrap: true,
    wrappingIndent: 'same',
    lineNumbersMinChars: 3,
    scrollBeyondLastLine: false,
    //renderWhitespace: 'boundary',
    //renderIndentGuides: true,
    //readOnly: false,
    automaticLayout: true,

    // diff
    renderSideBySide: false,
    //enableSplitViewResizing: true,
    //originalEditable: false,
  };

  static optionsModel = {

    tabSize: 2,
  };


  // init
  // ------

  state = {
    editor: undefined,
    monaco: undefined,
  };

  onMount = (instance, monaco) => {
    const editor = instance.modifiedEditor || instance;


    // model options
    // ---------------

    const models = monaco.editor.getModels();
    models.forEach(model => model.updateOptions(Editor.optionsModel));


    // key bindings
    // --------------

    const {
      props: {
        onSwitchLeft,
        onSwitchRight,
      },
      onSave,
      onClose,
      onReload,
    } = this;

    const {
      KeyMod: {
        Alt,
        WinCtrl,
      },
      KeyCode: {
        KEY_S,
        KEY_C,
        KEY_R,
        LeftArrow,
        RightArrow,
      },
    } = monaco;

    /* eslint-disable no-bitwise */
    editor.addCommand(WinCtrl | Alt | LeftArrow, onSwitchLeft);
    editor.addCommand(WinCtrl | Alt | RightArrow, onSwitchRight);
    editor.addCommand(WinCtrl | Alt | KEY_S, onSave);
    editor.addCommand(WinCtrl | Alt | KEY_C, onClose);
    editor.addCommand(WinCtrl | Alt | KEY_R, onReload);
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
        original,
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
          requireConfig={Editor.optionsRequire}
          options={Editor.optionsEditor}
          editorDidMount={onMount}
          width="auto"
          height="auto"
          language="yaml"
          original={original}
          value={value}
          onChange={onValue}
        />
      </div>
    );
  }
}
