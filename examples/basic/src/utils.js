import PropTypes from 'prop-types'
import { compose, withContext, getContext } from 'recompose'

// Create HOC that gets firestore from react context and passes it as a prop
export const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object })
)
