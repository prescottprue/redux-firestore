import React from 'react';
import PropTypes from 'prop-types'
import { compose } from 'redux';
import { withHandlers, lifecycle } from 'recompose'
import { connect } from 'react-redux';
import { withFirestore } from './utils';
import Todo from './Todo';
import NewTodo from './NewTodo';

const Todos = ({ todos, onNewSubmit, onDoneClick }) => (
  <div>
    <NewTodo onNewSubmit={onNewSubmit} />
    {
      todos === undefined
      ? <span>Loading</span>
      : !todos.length
        ? <span>No todos found</span>
        :
          todos.map((todo, i) => (
            <Todo
              key={`${todo.id}-${i}`}
              todo={todo}
            />
          ))
    }
  </div>
)

Todos.propTypes = {
  todos: PropTypes.array,
  onNewSubmit: PropTypes.func.isRequired,
  store: PropTypes.shape({
    firestore: PropTypes.object
  })
}

// Create HOC that loads data and adds it as todos prop
const enhance = compose(
  // add redux store (from react context) as a prop
  withFirestore,
  // Handler functions as props
  withHandlers({
    loadData: props => err => props.firestore.setListener({
      collection: 'todos',
      orderBy: ['createdAt', 'desc'],
      limit: 10
    }),
    onNewSubmit: props => newTodo =>
      props.firestore.add('todos', {
        ...newTodo,
        owner: 'Anonymous',
        createdAt: props.firestore.FieldValue.serverTimestamp()
      }),
  }),
  // Run functionality on component lifecycle
  lifecycle({
    // Load data when component mounts
    componentWillMount() {
      this.props.loadData()
    },
    componentWillUnmount() {
      this.props.firestore.unsetListener({
        collection: 'todos',
        orderBy: ['createdAt', 'desc'],
        limit: 10
      })
    }
  }),
  // Connect todos from redux state to props.todos
  connect(({ firestore }) => ({ // state.firestore
    todos: firestore.ordered.todos, // document data in array
    // todos: firestore.data.todos, // document data by id
  }))
)

export default enhance(Todos)
