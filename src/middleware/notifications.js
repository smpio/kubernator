import { notification } from 'antd';

const CONFIG = {
  ERROR: {
    duration: 0,
    style: {
      'backgroundColor': 'lightpink',
    },
  },
};

export default store => next => action => {
  const {
    error,
    payload: {
      code = '[nocode]',
      reason = '[noreason]',
      message = '[nomessage]',
    } = {},
  } = action;

  if (error) {
    notification.open({
      ...CONFIG.ERROR,
      message: `${code}: ${reason}`,
      description: message,
    });
  }

  return next(action);
};
