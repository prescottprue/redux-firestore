import { loadable } from 'utils/router'
import { ACCOUNT_PATH as path } from 'constants/paths'

export default {
  path,
  component: loadable(() =>
    import(/* webpackChunkName: 'Account' */ './components/AccountPage')
  )
}
