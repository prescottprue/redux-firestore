import React, { useEffect } from 'react';
import PropTypes from 'prop-types'
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withFirestore } from './utils';
import Todo from './Todo';
import NewTodo from './NewTodo';

const listenerSettings = {
  collection: 'todos',
  orderBy: ['createdAt', 'asc'],
  limit: 10
}

function Todos({ todos, firestore }) {
  useEffect(() => {
    firestore.setListener(listenerSettings)
    return function cleanup() {
      firestore.unsetListener(listenerSettings)
    }
  }, [])

  return (
    <div>
      <NewTodo />
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
}

Todos.propTypes = {
  todos: PropTypes.array,
  firestore: PropTypes.shape({
    setListener: PropTypes.func.isRequired,
    unsetListener: PropTypes.func.isRequired
  })
}

// Create HOC that loads data and adds it as todos prop
const enhance = compose(
  // add redux store (from react context) as a prop
  withFirestore,
  // Connect todos from redux state to props.todos
  connect(({ firestore }) => ({ // state.firestore
    todos: firestore.ordered.todos, // document data in array
    // todos: firestore.data.todos, // document data by id
  }))
)

export default enhance(Todos)
