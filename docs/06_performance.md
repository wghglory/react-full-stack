# Performance

## life cycle

`componentWillReceiveProps(nextProps){ }`

Parent component re-renders child components, the child component will receive props and child's componentWillReceivedProps will be invoked with new Props. New Props may be the same as old props, so a call of componentWillReceiveProps doesn't mean rendering component for sure. Not used for performance.

`shouldComponentUpdate(nextProps, nextState){ return true/false }`

`componentWillUpdate(nextProps, nextState){ }`: the render is going to happen.

## Ways to optimize performance

### PureComponent

原理：内部调用 shouldComponentUpdate(), 如果 nextProps, nextState 和之前的一样则不会 re-render。**能使用 PureComponent 就不要用 Component。大部分需求都是只要 nextProps or nextState 和之前不同就不重新渲染。**

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

a)  从 store 获取得 timestamp 立即过滤为时分，结合 PureComponent。这样只有每分钟后 timestamp props 才会变化。

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

## Profiling Components in Chrome using `react_perf` flag

<https://reactjs.org/docs/perf.html>

Access `http://localhost:3000/?/react_perf`, record in performance tab, and you will see `User Timing` area. Below is react 16. Mac 双指触控板上下 zoom in/out.

![performance](http://om1o84p1p.bkt.clouddn.com//1510302402.png)

## Performance tools

> react 16 doesn't support `react-addons-perf` any more!!!

```bash
yarn add react-addons-perf --dev
```

```jsx
import Perf from 'react-addons-perf'
```

### 不用 function component 而用 PureComponent 避免多余的 re-renders

**ArticleList performance optimization**:

现在问题能看到 ArticleList 每秒都在重新 render，ArticleList should not re-render every time since it doesn't change. What changes is the global time. 原因在于目前 react 无法优化 function component. 如果不是用 HOC 去优化 function component, function component 每次都会重新改变渲染。

1. 因为 ArticleList 也是一个 function。可以直接在引用出调用。就 performance 而言好了，但是 react tools 看不到  ArticleList，而只能看到 div 包裹了 ArticleContainer。（╮(╯﹏╰)╭）

    ```diff
    return (
      <div>
        {/* <Timestamp timestamp={this.state.timestamp} /> */}
        <Timestamp />
        {/* <SearchBar doSearch={this.props.store.setSearchTerm} /> */}
        <SearchBar />
    -    <ArticleList articles={articles} />
    +    {ArticleList({ articles })}
      </div>
    );
    ```

1. 把 function component 改成 PureComponent

    ```diff
    - const ArticleList = ({ articles }) => {
    -   return (
    -     <div>
    -       {Object.values(articles).map((article) => <Article key={article.id} article={article} />)}
    -     </div>
    -   );
    - };
    + class ArticleList extends React.PureComponent {
    +   render() {
    +     return (
    +       <div>
    +         {Object.values(this.props.articles).map((article) => (
    +           <Article key={article.id} article={article} />
    +         ))}
    +       </div>
    +     );
    +   }
    + }
    ```

同样道理，把 Article 也换成 PureComponent 写法。

### Making store-connected components subscribe to partial state

App component 换成 PureComponent 后还是有多余渲染。这时候坚持其 render。目前 code 如下

```jsx
export default class App extends PureComponent {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }

  state = this.props.store.getState();

  // ...

  render() {
    let { articles, searchTerm } = this.state;
    // ...
  }
}
```

App 目前 subscribe 了 full stored state. 其实它只需要 `articles, searchTerm` out of state. 所以其他的一些 state，本来不需要 App 接受，使得 App component 有了多余的 rerenders.

解决1：add shouldComponentUpdate。缺陷就是 shouldComponentUpdate 依赖 App render。如果 render 增加别的比如 authors, shouldComponentUpdate 也要改变。

```jsx
shouldComponentUpdate(nextProps, nextState) {
  return (
    nextState.articles !== this.state.articles || nextState.searchTerm !== this.state.searchTerm
  );
}
```

解决2：订阅部分 state

App.js:

```diff
// ...
export default class App extends PureComponent {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }

+  appState = () => {
+    const { articles, searchTerm } = this.props.store.getState();
+    return { articles, searchTerm };
+  };
+
-  state = this.props.store.getState();
+  state = this.appState();

  onStoreChange = () => {
-    this.setState(this.props.store.getState());
+    this.setState(this.appState());
  };

  componentDidMount() {
    this.subscriptionId = this.props.store.subscribe(this.onStoreChange);
    this.props.store.startClock();
  }

  componentWillUnmount() {
    this.props.store.unsubscribe(this.subscriptionId);
  }

-  // 避免多余渲染！此法缺陷就是 shouldComponentUpdate 依赖 App render。如果 render 增加别的比如 authors, shouldComponentUpdate 也要改变。
-  // shouldComponentUpdate(nextProps, nextState) {
-  //   return (
-  //     nextState.articles !== this.state.articles || nextState.searchTerm !== this.state.searchTerm
-  //   );
-  // }

  render() {
    let { articles, searchTerm } = this.state;
    //...
  }
}
```

其余 ArticleContainer, TimestampContainer, SearchTermContainer 也如此优化。因为目前 StoreProvider onStoreChange forceUpdate 使得即使任何 store state 改变都会引起 Container 的 rerender，即使有些 Container 不关心某些 state 的改变。

SearchBar.js 依赖于 timestamp state，不依赖其他 state，那么我只希望在 timestamp 变化时候 forceUpdate，其他 store 中 articles 的变化不该让我 forceUpdate。

```javascript
function extraProps(store, originalProps) {
  return {
    timestamp: store.getState().timestamp
  };
}
```

改变 StoreProvider:

```diff
import React from 'react';
import PropTypes from 'prop-types';

const StoreProvider = (extraProps = () => ({})) => (Component) => {
  return class extends React.PureComponent {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

+    usedState = () => {
+      return extraProps(this.context.store, this.props);
+    };

+    state = this.usedState();

+    // 只改变 extraProps 传过来的 state，而不是 forceUpdate 任何改变
+    onStoreChange = () => {
+      if (this.subscriptionId) {
-        this.forceUpdate();
+        this.setState(this.usedState());
+      }
+    };

    componentDidMount() {
      this.subscriptionId = this.context.store.subscribe(this.onStoreChange);
    }

    componentWillUnmount() {
      this.context.store.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }

    render() {
+      return <Component {...this.props} store={this.context.store} {...this.usedState()} />;
    }
  };

  /*   const WithStoreContainer = (props, context) => {
    return <Component {...props} store={context.store} />;
  };

  WithStoreContainer.contextTypes = {
    store: PropTypes.object
  };

  WithStoreContainer.displayName = `${Component.name}Container`;

  return WithStoreContainer; */
};

export default StoreProvider;
```

经过上面改变，ArticleContainer 不再有多余渲染，但是 TimestampContainer 还是每秒渲染。why？

TimestampContainer extraProps timestamp 每秒都在变化，所以它会每秒渲染。而 Timestamp 因为 shouldComponentUpdate 每分钟渲染。

```jsx
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
    return <div>{this.timeDisplay(this.props.timestamp)}</div>;
  }
}

function extraProps(store, originalProps) {
  return {
    timestamp: store.getState().timestamp
  };
}

export default StoreProvider(extraProps)(Timestamp);
```

我们可以把 shouldComponentUpdate 删除。在 Container 级别控制 timestamp 直接显示 时分 最终结果，这样 container 就每分钟变化了。

```diff
import React from 'react';
import StoreProvider from './StoreProvider';

// 假设我们页面只显示小时和分钟，不显示秒。但 tick 还在每秒执行，所以期望每60s 页面 render 一次。
+ class Timestamp extends React.PureComponent {
+  static timeDisplay = (timestamp) =>
    timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

-  shouldComponentUpdate(nextProps, nextState) {
-    return this.timeDisplay(this.props.timestamp) !== this.timeDisplay(nextProps.timestamp);
-  }

  render() {
+    return <div>{this.props.timestampDisplay}</div>;
  }
}

function extraProps(store, originalProps) {
  return {
-    // timestamp: store.getState().timestamp
+    timestampDisplay: Timestamp.timeDisplay(store.getState().timestamp)
  };
}

export default StoreProvider(extraProps)(Timestamp);
```