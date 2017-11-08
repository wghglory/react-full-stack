// to publish this as npm package in future, using absolute path is easier
class StateApi {
  constructor(rawData) {
    this.data = {
      articles: this.mapArr2Obj(rawData.articles),
      authors: this.mapArr2Obj(rawData.authors),
      searchTerm: '',
      timestamp: new Date()
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

  startClock = () => {
    setInterval(() => {
      this.mergeWithState({
        timestamp: new Date()
      });
    }, 1000);
  };

  lookupAuthor = (authorId) => {
    return this.data.authors[authorId];
  };
}

export default StateApi;
