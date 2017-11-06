import React from 'react';
import ReactDOM from 'react-dom';
import { Component } from 'react';

export default class App extends Component {
  state = {
    answer: 100
  };

  asyncFunc = () => {
    return Promise.resolve(33);
  };

  // babel-polyfill, and add it in webpack entry
  async componentDidMount() {
    this.setState({
      answer: await this.asyncFunc()
    });

    // this.asyncFunc().then((res) => {
    //   this.setState({
    //     answer: res
    //   });
    // });
  }

  render() {
    return <div>test - {this.state.answer}</div>;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
