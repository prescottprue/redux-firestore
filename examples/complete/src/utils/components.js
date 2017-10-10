import PropTypes from 'prop-types'
import { compose, withContext, getContext, withHandlers, withProps } from 'recompose'
import { showError } from 'modules/notification/actions'

export const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object })
)

export const withFirestore = compose(
  withStore,
  withProps(({ store }) => ({ firestore: store.firestore }))
)

export const withFirebase = compose(
  withStore,
  withProps(({ store }) => ({ firebase: store.firebase }))
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
