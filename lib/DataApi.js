class DataApi {
  constructor(rawData) {
    this.rawData = rawData;
  }

  mapArr2Obj(arr) {
    return arr.reduce((accu, curr) => {
      accu[curr.id] = curr;
      return accu;
    }, {});
  }

  getArticles() {
    return this.mapArr2Obj(this.rawData.articles);
  }

  getAuthors() {
    return this.mapArr2Obj(this.rawData.authors);
  }
}

export default DataApi;
