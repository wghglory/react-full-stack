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

  setSearchTerm = (searchTerm) => {
    this.setState({ searchTerm });
  };

  render() {
    let { articles, searchTerm } = this.state;
    if (searchTerm) {
      articles = pickBy(articles, (value, key) => {
        return value.title.match(searchTerm) || value.body.match(searchTerm);
      });
    }

    return (
      <div>
        <SearchBar doSearch={this.setSearchTerm} />
        <ArticleList articles={articles} />
      </div>
    );
  }
}
