import React from 'react';
import StoreProvider from './StoreProvider';

// 假设我们页面只显示小时和分钟，不显示秒。但 tick 还在每秒执行，所以期望每60s 页面 render 一次。
class Timestamp extends React.Component {
  timeDisplay = (timestamp) =>
    timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

  shouldComponentUpdate(nextProps, nextState) {
    return this.timeDisplay(this.props.timestamp) !== this.timeDisplay(nextProps.timestamp);
  }

  componentWillUpdate() {
    console.log('updating timestamp...');
  }

  render() {
    return (
      <div>
        {this.props.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    );
  }
}

function extraProps(store, originalProps) {
  return {
    timestamp: store.getState().timestamp
  };
}

export default StoreProvider(extraProps)(Timestamp);
