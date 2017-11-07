# React full stack advanced app

1. avoid client and server side fetching data twice
1. avoid client componentDidMount throwing away server markup and mount the same markup again

To solve this, deliver initial data and initial markup together from server side, and attach initial data to window object, so client side will have that data.

---

* [01 Setup project, yarn, eslint](./docs/01_setup.md)
* [02 Jest testing, Data transform, server rendering](./docs/02_fullStack.md)
* [03 node, webpack Absolute path](./docs/03_refactor.md)