import React, { Component } from 'react';
// import DataApi from '../state-api';
import ArticleList from './ArticleList';
// import axios from 'axios';
import PropTypes from 'prop-types';
import SearchBar from './SearchBar';
import pickBy from 'lodash.pickby';
import Timestamp from './Timestamp';

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
  // update when the store state changes... subscribe...
  // flux way: make StateApi extends EventEmitter
  // redux way: we will use

  // async componentDidMount() {
  //   const res = await axios.get('/data');
  //   const api = new DataApi(res.data);

  //   this.setState({
  //     articles: api.getArticles(),
  //     authors: api.getAuthors()
  //   });
  // }

  // 1. 传递过滤方法，在 Article 里面进行过滤
  // 2. this moved to state-api
  // articleActions = {
  //   lookupAuthor: (authorId) => this.state.authors[authorId]
  // };

  /*
  // Using store to manage state instead of react setState
  setSearchTerm = (searchTerm) => {
    this.setState({ searchTerm });
  }; */

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
    let { articles, searchTerm } = this.state;
    if (searchTerm) {
      const searchRgx = new RegExp(searchTerm, 'i');
      articles = pickBy(articles, (value, key) => {
        return value.title.match(searchRgx) || value.body.match(searchRgx);
      });
    }

    return (
      <div>
        {/* <Timestamp timestamp={this.state.timestamp} /> */}
        <Timestamp />
        {/* <SearchBar doSearch={this.props.store.setSearchTerm} /> */}
        <SearchBar />
        <ArticleList articles={articles} />
      </div>
    );
  }
}
