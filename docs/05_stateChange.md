# handle state

We want to filter article list by searchTerm.

**State-api/index.js**:

```diff
// to publish this as npm package in future, using absolute path is easier
class StateApi {
  constructor(rawData) {
    this.data = {
      articles: this.mapArr2Obj(rawData.articles),
      authors: this.mapArr2Obj(rawData.authors),
+      searchTerm: ''
    };
  }
  // ...
}
```

**App.js: Note `searchTerm` is in store**

> lodash.pickBy can filter for Object. First parameter is object, second is function

```diff
import React, { Component } from 'react';
// import DataApi from '../state-api';
import ArticleList from './ArticleList';
// import axios from 'axios';
import PropTypes from 'prop-types';
+ import SearchBar from './SearchBar';
+ import pickBy from 'lodash.pickby';

export default class App extends Component {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }

  state = this.props.store.getState();

+  setSearchTerm = (searchTerm) => {
+    this.setState({ searchTerm });
+  };

  render() {
+    let { articles, searchTerm } = this.state;
+    if (searchTerm) {
+      articles = pickBy(articles, (value, key) => {
+        return value.title.match(searchTerm) || value.body.match(searchTerm);
+      });
+    }

    return (
      <div>
+        <SearchBar doSearch={this.setSearchTerm} />
        <ArticleList articles={articles} />
      </div>
    );
  }
}
```

**SearchBar.js**: searchValue is a local state for SearchBar only. It's not part of store. After set local state, we call doSearch, which will set store state after 300 ms.

```jsx
import React, { Component } from 'react';
import debounce from 'lodash.debounce'; // yarn add lodash.debounce

class SearchBar extends Component {
  state = {
    searchValue: ''
  };

  doSearch = debounce(() => {
    this.props.doSearch(this.state.searchValue);
  }, 300);

  handleSearch = (e) => {
    // we don't want App to filter every change. We want to filter when typing id done by debounce.
    this.setState({ searchValue: e.target.value }, () => {
      this.doSearch();
    });
  };

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

export default SearchBar;
```

**Until now, we read the initial state of searchTerm (empty string) from store. And in App.js we still setState locally, but we haven't told store the change of searchTerm. We need to subscribe store to an external state change.**

## Subscribing to an external change

**State-api/index.js**:

```diff
// to publish this as npm package in future, using absolute path is easier
class StateApi {
  constructor(rawData) {
    this.data = {
      articles: this.mapArr2Obj(rawData.articles),
      authors: this.mapArr2Obj(rawData.authors),
      searchTerm: ''
    };

+    this.subscriptions = {};
+    this.lastSubscriptionId = 0;
  }

  mapArr2Obj = (arr) => {
    return arr.reduce((accu, curr) => {
      accu[curr.id] = curr;
      return accu;
    }, {});
  };

  getState = () => {
    return this.data;
  };

+  subscribe = (cb) => {
+    this.lastSubscriptionId++;
+    this.subscriptions[this.lastSubscriptionId] = cb;
+    return this.lastSubscriptionId;
+  };
+
+  unsubscribe = (subscriptionId) => {
+    delete this.subscriptions[subscriptionId];
+  };
+
+  notifySubscribers = () => {
+    Object.values(this.subscriptions).forEach((cb) => cb());
+  };
+
+  // like dispatch an action
+  mergeWithState = (stateChange) => {
+    this.data = {
+      ...this.data,
+      ...stateChange
+    };
+    this.notifySubscribers();
+  };
+
+  setSearchTerm = (searchTerm) => {
+    this.mergeWithState({
+      searchTerm
+    });
+  };

  lookupAuthor = (authorId) => {
    return this.data.authors[authorId];
  };
}

export default StateApi;
```

**App.js**:

在 searchTerm 变化时候，`doSearch={this.props.store.setSearchTerm}` 会改变 state-api 中的 state -- `this.data`。但我们还需要让 store 通知 react component，这样才会 re-render。思路就是 subscribe。

1. flux way: make StateApi extends EventEmitter
1. redux way: we already used as above

当 searchTerm 改变时，执行订阅的 onStoreChange，里面调用 react setState 方法，页面重新渲染。

```diff
import React, { Component } from 'react';
// import DataApi from '../state-api';
import ArticleList from './ArticleList';
// import axios from 'axios';
import PropTypes from 'prop-types';
import SearchBar from './SearchBar';
import pickBy from 'lodash.pickby';

export default class App extends Component {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }

  state = this.props.store.getState();

-  /*
-  // Using store to manage state instead of react setState
-  setSearchTerm = (searchTerm) => {
-    this.setState({ searchTerm });
-  }; */

+  onStoreChange = () => {
+    this.setState(this.props.store.getState());
+  };
+
+  componentDidMount() {
+    this.subscriptionId = this.props.store.subscribe(this.onStoreChange);
+  }
+
+  componentWillUnmount() {
+    this.props.store.unsubscribe(this.subscriptionId);
+  }

  render() {
    let { articles, searchTerm } = this.state;
    if (searchTerm) {
      articles = pickBy(articles, (value, key) => {
        return value.title.match(searchTerm) || value.body.match(searchTerm);
      });
    }

    return (
      <div>
-        <SearchBar doSearch={this.setSearchTerm} />
+        <SearchBar doSearch={this.props.store.setSearchTerm} />
        <ArticleList articles={articles} />
      </div>
    );
  }
}
```

## Passing state to child component -- Timestamp

正常 timestamp 不需要从 store 中设置，只需要在自己 component 中维护，这里举个例子，假设别的 component 也依赖 timestamp 这个 state，那么如何通过 state-api store 实现。

Timestamp.js:

```jsx
import React from 'react';

class Timestamp extends React.Component {
  render() {
    return <div>{this.props.timestamp.toString()}</div>;
  }
}

export default Timestamp;
```

State-api/index.js:

```diff
// to publish this as npm package in future, using absolute path is easier
class StateApi {
  constructor(rawData) {
    this.data = {
      articles: this.mapArr2Obj(rawData.articles),
      authors: this.mapArr2Obj(rawData.authors),
      searchTerm: '',
+      timestamp: new Date()
    };

    this.subscriptions = {};
    this.lastSubscriptionId = 0;
  }

  mapArr2Obj = (arr) => {
    return arr.reduce((accu, curr) => {
      accu[curr.id] = curr;
      return accu;
    }, {});
  };

  getState = () => {
    return this.data;
  };

  subscribe = (cb) => {
    this.lastSubscriptionId++;
    this.subscriptions[this.lastSubscriptionId] = cb;
    return this.lastSubscriptionId;
  };

  unsubscribe = (subscriptionId) => {
    delete this.subscriptions[subscriptionId];
  };

  notifySubscribers = () => {
    Object.values(this.subscriptions).forEach((cb) => cb());
  };

  // like dispatch an action
  mergeWithState = (stateChange) => {
    this.data = {
      ...this.data,
      ...stateChange
    };
    this.notifySubscribers();
  };

  setSearchTerm = (searchTerm) => {
    this.mergeWithState({
      searchTerm
    });
  };

+  startClock = () => {
+    setInterval(() => {
+      this.mergeWithState({
+        timestamp: new Date()
+      });
+    }, 1000);
+  };

  lookupAuthor = (authorId) => {
    return this.data.authors[authorId];
  };
}

export default StateApi;
```

App.js

```diff
import React, { Component } from 'react';
// import DataApi from '../state-api';
import ArticleList from './ArticleList';
// import axios from 'axios';
import PropTypes from 'prop-types';
import SearchBar from './SearchBar';
import pickBy from 'lodash.pickby';
+ import Timestamp from './Timestamp';

export default class App extends Component {
  static childContextTypes = {
    store: PropTypes.object
  };
  getChildContext() {
    return {
      store: this.props.store
    };
  }

  state = this.props.store.getState();

  onStoreChange = () => {
    this.setState(this.props.store.getState());
  };

  componentDidMount() {
    this.subscriptionId = this.props.store.subscribe(this.onStoreChange);
+    this.props.store.startClock();
  }

  componentWillUnmount() {
    this.props.store.unsubscribe(this.subscriptionId);
  }

  render() {
    let { articles, searchTerm } = this.state;
    if (searchTerm) {
      articles = pickBy(articles, (value, key) => {
        return value.title.match(searchTerm) || value.body.match(searchTerm);
      });
    }

    return (
      <div>
+        <Timestamp timestamp={this.state.timestamp} />
        <SearchBar doSearch={this.props.store.setSearchTerm} />
        <ArticleList articles={articles} />
      </div>
    );
  }
}
```

> 很可能出现如下 Warning: Text content did not match. Server: "Wed Nov 08 2017 23:44:54 GMT+0800 (CST)" Client: "Wed Nov 08 2017 23:44:55 GMT+0800 (CST)". 因为 client 和 server 渲染有时差。

## Subscribing to state from child component directly

Child component can subscribe to state, instead of passing state from parent deeply to the child.

**App.js**:

```diff
// ...

export default class App extends Component {
  onStoreChange = () => {
    this.setState(this.props.store.getState());
  };

  componentDidMount() {
    this.subscriptionId = this.props.store.subscribe(this.onStoreChange);
    this.props.store.startClock();
  }

  componentWillUnmount() {
    this.props.store.unsubscribe(this.subscriptionId);
  }

  render() {
    // ...

    return (
      <div>
-        <Timestamp timestamp={this.state.timestamp} />
+        <Timestamp />
        <SearchBar doSearch={this.props.store.setSearchTerm} />
        <ArticleList articles={articles} />
      </div>
    );
  }
}
```

**Timestamp.js**:

```diff
import React from 'react';
+ import StoreProvider from './StoreProvider';

class Timestamp extends React.Component {
  render() {
    return <div>{this.props.timestamp.toString()}</div>;
  }
}

+ function extraProps(store, originalProps) {
+   return {
+     timestamp: store.getState().timestamp
+   };
+ }
+
+ export default StoreProvider(extraProps)(Timestamp);
```

**StoreProvider original**:

```jsx
import React from 'react';
import PropTypes from 'prop-types';

const StoreProvider = (extraProps) => (Component) => {
  return class extends React.Component {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

    render() {
      return (
        <Component
          {...this.props}
          store={this.context.store}
          {...extraProps(this.context.store, this.props)}
        />
      );
    }
  };
};

export default StoreProvider;
```

Everything is working well. App component 调用 startClock，并订阅了 storeChange，react setState 触发导致 App 重新渲染，使得子组件包含 TimestampContainer、Timestamp 都被重新渲染，所以页面 clock ticking。

一个问题是 TimestampContainer 并不涉及到 timestamp，TimestampContainer 没有 props 和 state，只有 context。我们是向 Timestamp 组件中传递了 extraProps -- timestamp 和 store 作为 props。如此看来没必要重新渲染 TimestampContainer。把其改成 PureComponent。

**StoreProvider Pure**:

```diff
const StoreProvider = (extraProps) => (Component) => {
-  return class extends React.Component {
+  return class extends React.PureComponent {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

    render() {
      return (
        <Component
          {...this.props}
          store={this.context.store}
          {...extraProps(this.context.store, this.props)}
        />
      );
    }
  };
};
```

但这样 clock 不 ticking 了。TimestampContainer context 不变了，虽然 App context 值还在变化。TimestampContainer 和 子组件不会重新渲染，除非有 state 或者 props 的改变。而 TimestampContainer 是没有 state 和 props，我们给他 fake state, subscribe change and forceUpdate。

**StoreProvider forceUpdate**:

```diff
import React from 'react';
import PropTypes from 'prop-types';

/**
 * accept a view component, and return a container wrapper component with store from context API
 * @param {*} Component : a view component
 * @return a container component with store from context
 */
const StoreProvider = (extraProps) => (Component) => {
  return class extends React.PureComponent {
    static displayName = `${Component.name}Container`;

    static contextTypes = {
      store: PropTypes.object
    };

+    onStoreChange = () => {
+      this.forceUpdate();
+    };
+
+    componentDidMount() {
+      this.subscriptionId = this.context.store.subscribe(this.onStoreChange);
+    }
+
+    componentWillUnmount() {
+      this.props.store.unsubscribe(this.subscriptionId);
+    }

    render() {
      return (
        <Component
          {...this.props}
          store={this.context.store}
          {...extraProps(this.context.store, this.props)}
        />
      );
    }
  };
};

export default StoreProvider;
```