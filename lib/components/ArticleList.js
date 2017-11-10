import React from 'react';
import Article from './Article';

class ArticleList extends React.PureComponent {
  render() {
    return (
      <div>
        {Object.values(this.props.articles).map((article) => (
          <Article key={article.id} article={article} />
        ))}
      </div>
    );
  }
}
// const ArticleList = ({ articles }) => {
//   return (
//     <div>
//       {Object.values(articles).map((article) => <Article key={article.id} article={article} />)}
//     </div>
//   );
// };

export default ArticleList;
