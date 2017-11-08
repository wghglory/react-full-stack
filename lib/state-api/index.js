// to publish this as npm package in future, using absolute path is easier
class StateApi {
  constructor(rawData) {
    this.data = {
      articles: this.mapArr2Obj(rawData.articles),
      authors: this.mapArr2Obj(rawData.authors),
      searchTerm: ''
    };
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

  lookupAuthor = (authorId) => {
    return this.data.authors[authorId];
  };
}

export default StateApi;
