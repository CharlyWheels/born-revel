import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

const BabyLists = () => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const [lists, setLists] = useState([]);
  const [name, setName] = useState('');
  const [items, setItems] = useState('');
  const [articleQuery, setArticleQuery] = useState('');
  const [articleSuggestions, setArticleSuggestions] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    console.log('BabyLists component rendered');
    console.log('user in BabyLists:', user);
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetch(`/api/baby-lists/${user.uid}`)
          .then((res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch baby lists');
            }
            return res.json();
          })
          .then((data) => {
            console.log('Fetched baby lists:', data);
            setLists(Array.isArray(data) ? data : []);
          })
          .catch((error) => console.error('Error fetching baby lists:', error));
      }
    }
  }, [user, loading, router]);

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

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/baby-lists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          items: items.split(','),
          userId: user.uid,
          email: user.email,
          articleIds: selectedArticles.map(article => article.id),
        }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      if (!response.ok) {
        setError(data?.error || `Server error (${response.status})`);
        return;
      }
      const newList = data;
      setLists((prevLists) => [...prevLists, newList]);
      setName('');
      setItems('');
      setSelectedArticles([]);
    } catch (error) {
      setError(`An error occurred: ${error.message}`);
      console.error('Error creating list:', error);
    }
  };

  const handleSelectArticle = (article) => {
    setSelectedArticles((prev) => [...prev, article]);
    setArticleQuery('');
  };

  if (loading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white">
      <h1 className="text-4xl font-bold mb-8">{t('babyLists.title')}</h1>
      {error && (
        <div className="bg-red-500/80 backdrop-blur text-white px-4 py-3 rounded-lg mb-4 max-w-md">
          {error}
        </div>
      )}
      <form onSubmit={handleCreateList} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('babyLists.listName')}
          required
          className="w-full px-4 py-2 rounded bg-white text-gray-800"
        />
        <input
          type="text"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          placeholder={t('babyLists.items')}
          required
          className="w-full px-4 py-2 rounded bg-white text-gray-800"
        />
        <input
          type="text"
          value={articleQuery}
          onChange={(e) => setArticleQuery(e.target.value)}
          placeholder={t('babyLists.searchArticles')}
          className="w-full px-4 py-2 rounded bg-white text-gray-800"
        />
        {articleSuggestions.length > 0 && (
          <ul className="bg-white text-gray-800 rounded shadow-md">
            {articleSuggestions.map((article) => (
              <li
                key={article.id}
                onClick={() => handleSelectArticle(article)}
                className="cursor-pointer p-2 hover:bg-gray-200"
              >
                {article.name}
              </li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          className="w-full bg-white text-red-500 py-2 px-4 rounded shadow-md hover:bg-red-100 transition"
        >
          {t('babyLists.createList')}
        </button>
      </form>
      <div className="mt-8 w-full max-w-md">
        {lists.map((list) => (
          <Link key={list.id} href={`/baby-list/${list.id}`} className="block bg-white text-gray-800 p-4 rounded shadow-md mb-4 hover:bg-gray-100 transition">
            <h2 className="text-xl font-bold">{list.name}</h2>
            <ul className="list-disc pl-5">
              {list.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BabyLists; 