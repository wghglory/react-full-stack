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
