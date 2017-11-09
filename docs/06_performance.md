# Performance

## life cycle

`componentWillReceiveProps(nextProps){ }`

Parent component re-renders child components, the child component will receive props and child's componentWillReceivedProps will be invoked with new Props. New Props may be the same as old props, so a call of componentWillReceiveProps doesn't mean rendering component for sure. Not used for performance.

`shouldComponentUpdate(nextProps, nextState){ return true/false }`

`componentWillUpdate(nextProps, nextState){ }`: the render is going to happen.

## Ways to optimize performance

### PureComponent

原理：内部调用 shouldComponentUpdate(), 如果 nextProps, nextState 和之前的一样则不会 re-render。

**SearchBar.js**:

```diff
+ import React, { PureComponent } from 'react';
import debounce from 'lodash.debounce'; // yarn add lodash.debounce
import StoreProvider from './StoreProvider';

+ class SearchBar extends PureComponent {
  state = {
    searchValue: ''
  };

  doSearch = debounce(() => {
    // this.props.doSearch(this.state.searchValue);
    this.props.store.setSearchTerm(this.state.searchValue);
  }, 300);

  handleSearch = (e) => {
    // we don't want App to filter every change. We want to filter when typing id done by debounce.
    this.setState({ searchValue: e.target.value }, () => {
      this.doSearch();
    });
  };

  // shouldComponentUpdate(nextProps, nextState) {
  //   return false;
  // }

  // componentWillUpdate() {
  //   console.log('update..');
  // }

  render() {
    return (
      <input
        type="search"
        placeholder="enter search"
        onChange={this.handleSearch}
        value={this.state.searchValue}
      />
    );
  }
}

export default StoreProvider()(SearchBar);
```

### shouldComponentUpdate

**Timestamp.js**: 假设我们页面只显示小时和分钟，不显示秒。但 tick 还在每秒执行，所以期望每60s 页面 render 一次，而不是每秒 render。

```jsx
import React from 'react';
import StoreProvider from './StoreProvider';

// 假设我们页面只显示小时和分钟，不显示秒。但 tick 还在每秒执行，所以期望每60s 页面 render 一次。
class Timestamp extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return true;
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
```

即使把 shouldComponentUpdate 删了，换成 PureComponent 也没用，还是每秒渲染。因为后来的 timestamp 还是 `store.getState().timestamp`，这个值每秒变化，和之前 props 不一样。

解决方案2个：

a)  从 store 获取得 timestamp 立即过滤为时分。这样只有每分钟后 timestamp props 才会变化。

```diff
import React from 'react';
import StoreProvider from './StoreProvider';

// 假设我们页面只显示小时和分钟，不显示秒。但 tick 还在每秒执行，所以期望每60s 页面 render 一次。
+ class Timestamp extends React.PureComponent {
  componentWillUpdate() {
    console.log('updating timestamp...');
  }

  render() {
+    return <div>{this.props.timestamp}</div>;
  }
}

function extraProps(store, originalProps) {
  return {
+    timestamp: store.getState().timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export default StoreProvider(extraProps)(Timestamp);
```

b) 重写 shouldComponentUpdate, 使用它时候只能用 Component，不能用 PureComponent

```diff
import React from 'react';
import StoreProvider from './StoreProvider';

// 假设我们页面只显示小时和分钟，不显示秒。但 tick 还在每秒执行，所以期望每60s 页面 render 一次。
+ class Timestamp extends React.Component {
+  timeDisplay = (timestamp) =>
+    timestamp.toLocaleTimeString([], {
+      hour: '2-digit',
+      minute: '2-digit'
+    });
+
+  shouldComponentUpdate(nextProps, nextState) {
+    return this.timeDisplay(this.props.timestamp) !== this.timeDisplay(nextProps.timestamp);
+  }

  componentWillUpdate() {
    console.log('updating timestamp...');
  }

  render() {
    return (
      <div>
+        {this.props.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
```