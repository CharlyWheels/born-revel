import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const ListDetails = () => {
  const router = useRouter();
  const { listId } = router.query;
  const [list, setList] = useState(null);
  const [articleQuery, setArticleQuery] = useState('');
  const [articleSuggestions, setArticleSuggestions] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);

  useEffect(() => {
    if (listId) {
      fetch(`/api/baby-list/${listId}`)
        .then((res) => res.json())
        .then((data) => setList(data))
        .catch((error) => console.error('Error fetching list details:', error));
    }
  }, [listId]);

  useEffect(() => {
    if (articleQuery) {
      fetch(`/api/articles/suggestions?query=${articleQuery}`)
        .then((res) => res.json())
        .then((data) => setArticleSuggestions(data))
        .catch((error) => console.error('Error fetching article suggestions:', error));
    } else {
      setArticleSuggestions([]);
    }
  }, [articleQuery]);

  const handleAddArticle = async (article) => {
    try {
      const response = await fetch(`/api/baby-list/${listId}/add-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id }),
      });
      if (!response.ok) {
        throw new Error('Failed to add article to list');
      }
      const updatedList = await response.json();
      setList(updatedList);
      setArticleQuery('');
    } catch (error) {
      console.error('Error adding article:', error);
    }
  };

  if (!list) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white">
      <h1 className="text-4xl font-bold mb-8">{list.name}</h1>
      <div className="w-full max-w-md">
        {list.articles.map((article) => (
          <div key={article.id} className="bg-white text-gray-800 p-4 rounded shadow-md mb-4">
            <h2 className="text-xl font-bold">{article.name}</h2>
            <ul className="list-disc pl-5">
              {article.imageUrls.map((url, index) => (
                <li key={index}><img src={url} alt={article.name} className="w-full h-auto" /></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={articleQuery}
        onChange={(e) => setArticleQuery(e.target.value)}
        placeholder="Search for articles"
        className="w-full px-4 py-2 rounded bg-white text-gray-800"
      />
      {articleSuggestions.length > 0 && (
        <ul className="bg-white text-gray-800 rounded shadow-md">
          {articleSuggestions.map((article) => (
            <li
              key={article.id}
              onClick={() => handleAddArticle(article)}
              className="cursor-pointer p-2 hover:bg-gray-200"
            >
              {article.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ListDetails; 