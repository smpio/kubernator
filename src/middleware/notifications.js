import { notification } from 'antd';

export default store => next => action => {
  const {
    error,
    payload: {
      message = 'Unknown error',
    } = {},
  } = action;

  error && notification.open({
    message: 'ERROR',
    description: message,
  });

  return next(action);
};
