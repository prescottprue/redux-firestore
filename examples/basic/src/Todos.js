import React from 'react';
import PropTypes from 'prop-types'
import { compose } from 'redux';
import { withContext, getContext, withHandlers } from 'recompose'
import { connect } from 'react-redux';
// import { firebaseConnect } from 'redux-firestore';
import Todo from './Todo';
import NewTodo from './NewTodo';

const Todos = ({ todos, uid, store: { firestore } }) => (
  <div>
    <NewTodo
      onNewSubmit={(newTodo) =>
        firestore.push('todos', { ...newTodo, owner: 'Anonymous' })
      }
    />
    {
      todos
      ?
        todos.map((todo, i) => (
          <Todo
            key={`${todo.key}-${i}`}
            text={todo.text}
            owner={todo.owner}
            done={todo.done}
            disabled={todo.owner !== uid}
            onDoneClick={() =>
              firestore.update(`todos/${todo.key}`, { done: !todo.done })
            }
          />
        ))
      :
        <span>Loading</span>
    }
  </div>
);

const withStore = compose(
  withContext({ store: PropTypes.object }, () => {}),
  getContext({ store: PropTypes.object }),
)

export default compose(
  withStore,
  withHandlers({
    loadData: props => err => props.store.firestore.get('todos'),
    addData: props => err => props.store.firestore.push,
  }),
  connect(({ firebase }) => ({ // state.firebase
    // ImmutableJS map (for plain js checkout v2)
    todos: firebase.ordered.todos,
    uid: firebase.profile.uid
  }))
)(Todos)
