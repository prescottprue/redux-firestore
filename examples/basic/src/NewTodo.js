import React, { useState } from 'react';
import { get } from 'lodash';
import { withFirestore } from './utils';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem'
  }
};

function NewTodo({ firestore }) {
  const [inputValue, onInputChange] = useState(null)

  function onNewClick() {
    return firestore.add('todos', {
      text: inputValue,
      done: false,
      owner: 'Anonymous',
      createdAt: firestore.FieldValue.serverTimestamp()
    })
  }

  return (
    <div style={styles.container}>
      <input onChange={(e) => onInputChange(get(e, 'target.value', null))} type="text" />
      <button onClick={onNewClick}>Submit</button>
    </div>
  )
}

export default withFirestore(NewTodo)
