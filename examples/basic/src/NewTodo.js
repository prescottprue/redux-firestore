import React, { Component } from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem'
  }
};

class NewTodo extends Component {
  newSubmit = () => {
    this.props.onNewSubmit({
      text: this.input.value,
      done: false
    });
    this.input.value = '';
  }

  render() {
    const { text, owner } = this.props;
    
    return (
      <div style={styles.container}>
        <input ref={ref => this.input = ref} type="text" />
        <button onClick={this.newSubmit}>Submit</button>
      </div>
    )
  }
}

export default NewTodo