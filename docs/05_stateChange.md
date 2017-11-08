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