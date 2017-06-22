import { notification } from 'antd';

const CONFIG = {
  ERROR: {
    message: 'ERROR',
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
      message,
    } = {},
  } = action;

  error && notification.open({
    ...CONFIG.ERROR,
    description: message || 'Unknown error',
  });

  return next(action);
};
