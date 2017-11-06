import React, { Component } from 'react';
import DataApi from '../DataApi';
import { data } from '../testData';
import ArticleList from './ArticleList';

const api = new DataApi(data);

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      articles: api.getArticles(),
      authors: api.getAuthors()
    };
  }

  // 传递过滤方法，在 Article 里面进行过滤
  articleActions = {
    lookupAuthor: (authorId) => this.state.authors[authorId]
  };

  render() {
    return (
      <div>
        <ArticleList articles={this.state.articles} articleActions={this.articleActions} />
      </div>
    );
  }
}
