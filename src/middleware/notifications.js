import { message } from 'antd'

export default store => next => action => {
  const { error, payload } = action
  error && message.error(payload ? payload.message : 'Unknown error')
  return next(action)
}
