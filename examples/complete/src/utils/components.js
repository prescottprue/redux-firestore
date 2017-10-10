import PropTypes from 'prop-types'
import { compose, withContext, getContext, withHandlers } from 'recompose'
import { showError } from 'modules/notification/actions'

export const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object })
)

export const withRouter = compose(
  withContext({ router: PropTypes.object }, () => {}),
  getContext({ router: PropTypes.object })
)

export const withNotifications = compose(
  withStore,
  withHandlers({
    showError: props => err => showError(err)(props.store.dispatch)
  })
)

export default { withStore, withRouter }
