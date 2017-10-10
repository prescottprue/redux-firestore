import { LOGIN_PATH as path } from 'constants'

export default () => ({
  path,
  /*  Async getComponent is only invoked when route matches   */
  getComponent(nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure(
      [],
      require => {
        /*  Webpack - use require callback to define
          dependencies for bundling   */
        const Login = require('./components/LoginPage').default

        /*  Return getComponent   */
        cb(null, Login)

        /* Webpack named bundle   */
      },
      'Login'
    )
  }
})
