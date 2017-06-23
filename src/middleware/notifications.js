import { notification } from 'antd';

const CONFIG = {
  ERROR: {
    duration: 0,
    style: {
      'backgroundColor': 'lightpink',
    },
  },
};

function getMessage({ code, reason, message }) {

  let _message;
  if (!code && !reason) _message = 'Error: General';
  else if (!code) _message = `Error: ${reason}`;
  else if (!reason) _message = `Error: ${code}`;
  else _message = `${code}: ${reason}`;

  let _description = message || 'No description given :(';

  return {
    message: _message,
    description: _description,
  };
}

export default store => next => action => {
  const { error, payload = {}} = action;
  if (error) {
    notification.open({
      ...CONFIG.ERROR,
      ...getMessage(payload),
    });
  }
  return next(action);
};
