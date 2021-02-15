import { loadable } from 'utils/router'
import { SIGNUP_PATH as path } from 'constants/paths'

export default {
  path,
  component: loadable(() =>
    import(/* webpackChunkName: 'Signup' */ './components/SignupPage')
  )
}
