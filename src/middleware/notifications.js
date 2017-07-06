import { notification } from 'antd';

export class NotiErrorNet {
  constructor({ status, statusText, url }) {
    this.ignore = status === 403;
    this.message = `${status} ${statusText}`;
    this.description = url;
  }
}

export class NotiErrorApi {
  constructor({ code, reason, message }) {
    this.message = `${code} ${reason}`;
    this.description = message;
    this.duration = 0;
    this.style = {
      'backgroundColor': 'lightpink',
    };
  }
}

export default store => next => action => {
  const { error, payload } = action;
  if (
    error &&
    payload &&
    !payload.ignore &&
    (
      payload instanceof NotiErrorApi ||
      payload instanceof NotiErrorNet
    )
  ) notification.open(payload);
  return next(action);
};
