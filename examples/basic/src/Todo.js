import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem',
    border: '1px solid grey'
  },
  owner: {
    fontSize: '.6rem'
  },
  meta: {
    display: 'flex',
    flexDirection: 'column'
  }
}

const Todo = ({
  text,
  owner,
  isDone,
  disabled,
  onDoneClick
}) => (
  <div style={styles.container}>
    <input
      value={isDone}
      onChange={onDoneClick}
      disabled={disabled}
      type="checkbox"
    />
    <div style={styles.meta}>
      <span>{text}</span>
      <span style={styles.owner}>{owner}</span>
    </div>
  </div>
);

export default Todo