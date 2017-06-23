import { notification } from 'antd';

const TEMPLATE_ERROR = {
  duration: 0,
  style: {
    'backgroundColor': 'lightpink',
  },
};

export default store => next => action => {
  const {
    error,
    payload: {
      code,
      reason,
      message,
    } = {},
  } = action;

  if (error) {
    notification.open({
      ...TEMPLATE_ERROR,
      message: !code && !reason ? 'Shit happened' : `${code || '[nocode]'}: ${reason || '[noreason]'}`,
      description: message || 'No description given :(',
    });
  }

  return next(action);
};
