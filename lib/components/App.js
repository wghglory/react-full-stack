import React, { Component } from 'react';
// import DataApi from '../state-api';
import ArticleList from './ArticleList';
// import axios from 'axios';

export default class App extends Component {
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

  render() {
    return (
      <div>
        <ArticleList articles={this.state.articles} store={this.props.store} />
      </div>
    );
  }
}
