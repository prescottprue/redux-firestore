import { withStyles } from '@material-ui/core/styles'
import { compose } from 'recompose'
import { firestoreConnect } from 'react-redux-firebase'
import { firestoreOrderedSelector } from 'redux-firestore'
import { connect } from 'react-redux'
import styles from './HomePage.styles'

// Function which returns todos query config
function getTodosQuery() {
  return {
    collection: 'todos',
    where: ['done', '==', false],
    limit: 10
  }
}

const todosSelector = firestoreOrderedSelector(getTodosQuery())

export default compose(
  firestoreConnect(props => [getTodosQuery()]),
  connect((state, props) => ({
    todos: todosSelector(state),
    uid: state.firebase.auth.uid
  })),
  withStyles(styles)
)
