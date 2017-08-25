import { notification } from 'antd';

export class NotiErrorApi {
  constructor(apiResponse, netResponse) {

    // api response is an object
    if (typeof apiResponse === 'object') {
      const { code, reason, message } = apiResponse;
      this.message = `${code} ${reason}`;
      this.description = message;
    }

    // api response is a string or nothing
    else {
      const { status, statusText, url } = netResponse;
      this.message = `${status} ${statusText}`;
      this.description = apiResponse || url;
      this.silent = status === 403;
    }

    //
    this.duration = 0;
    this.style = { 'backgroundColor': 'lightpink' };
  }
}

export default store => next => action => {
  const { error, payload } = action;
  if (error) {
    
    // NotiErrorApi
    if (payload instanceof NotiErrorApi) {
      const { silent, description } = payload;
      if (!silent) notification.open(payload);
      else console.log(description);
    }

    // general error
    else {
      const { message } = payload;
      notification.open({
        message: 'Warning',
        description: message,
        style: { 'backgroundColor': 'bisque' },
      });
    }
  }
  return next(action);
};
