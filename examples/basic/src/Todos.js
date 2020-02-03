import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Todo from './Todo';
import NewTodo from './NewTodo';
import { useFirestore } from 'react-redux-firebase'

function Todos() {
  const todoIds = useSelector(state => state.firestore.ordered.todos)
  const firestore = useFirestore()
  const listenerSettings = {
    collection: 'todos',
    orderBy: ['createdAt', 'asc'],
    limit: 10
  }

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
        todoIds === undefined
        ? <span>Loading</span>
        : !todoIds.length
          ? <span>No todos found</span>
          :
            todoIds.map((todoId, i) => (
              <Todo
                key={`${todoId}-${i}`}
                id={todoId}
              />
            ))
      }
    </div>
  )
}

export default Todos
