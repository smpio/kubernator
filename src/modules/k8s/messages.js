import {
  PREFIX,
} from './shared';


// action codes
// --------------

export const MESSAGE_SHOW = `${PREFIX}/MESSAGE_SHOW`;


// action creators
// -----------------

export const messageShow = error => ({
  type: MESSAGE_SHOW,
  payload: { error },
});
