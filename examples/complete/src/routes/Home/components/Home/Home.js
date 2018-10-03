import React from 'react'
import PropTypes from 'prop-types'
import Theme from 'theme'
import { connect } from 'react-redux'
import { compose, lifecycle, withHandlers } from 'recompose'
import { withFirestore } from 'react-redux-firebase'
import { firestoreOrderedSelector } from 'redux-firestore'
import { withStore } from 'utils/components'
import classes from './Home.scss'

const Home = ({ todos }) => (
  <div
    className={classes.container}
    style={{ color: Theme.palette.primary2Color }}>
    <div className="flex-row-center">
      <h2>Home Route</h2>
    </div>
    <div>
      {todos && todos.map && todos.map((todo, i) => (
        <div key={`${todo.id}-${i}`}>{JSON.stringify(todo)}</div>
      ))}
    </div>
  </div>
)

Home.propTypes = {
  todos: PropTypes.array
}

// Function which returns todos query config
function getTodosQuery() {
  return {
    collection: 'todos',
    limit: 10
  }
}

// Function which returns todos query config
function getTodoEventsQuery(props) {
  if (!props.todoId) {
    console.error('todoId is required to create todo events query, check component props')
    return
  }
  return {
    collection: 'todos',
    doc: props.todoId,
    limit: 10,
    subcollections: [{ collection: 'events' }]
  }
}

const selector = firestoreOrderedSelector(getTodosQuery())

const enhance = compose(
  withStore,
  withFirestore,
  withHandlers({
    loadCollection: props => props.store.firestore.get,
    onNewSubmit: props => newTodo =>
      props.store.firestore.add('todos', {
        ...newTodo,
        owner: props.uid || 'Anonymous'
      })
  }),
  lifecycle({
    componentWillMount() {
      this.props.loadCollection(getTodosQuery())
    }
  }),
  connect((state, props) => ({
    todos: selector(state),
    uid: state.firebase.auth.uid
  }))
)

export default enhance(Home)
