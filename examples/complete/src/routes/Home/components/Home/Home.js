import React from 'react'
import PropTypes from 'prop-types'
import Theme from 'theme'
import { connect } from 'react-redux'
import { compose, lifecycle, withHandlers } from 'recompose'
import { withFirestore } from 'react-redux-firebase'
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
      {todos.map((todo, i) => (
        <div key={`${todo.id}-${i}`}>{JSON.stringify(todo)}</div>
      ))}
    </div>
  </div>
)

Home.propTypes = {
  todos: PropTypes.array
}

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
      this.props.loadCollection('todos')
    }
  }),
  connect(({ firestore, firebase }) => ({
    todos: firestore.ordered.todos || [],
    uid: firebase.auth.uid
  }))
)

export default enhance(Home)
