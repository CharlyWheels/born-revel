import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import Layout from '../../../components/Layout';
import ArticleSearch from '../../../components/ArticleSearch';
import GiftCard from '../../../components/GiftCard';

const GiftRegistry = () => {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { babyId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [giftItems, setGiftItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [editingGiftId, setEditingGiftId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    url: '',
    imageUrls: '',
    category: '',
    brand: '',
    price: '',
    providerImageUrl: '',
    providerDetails: '',
  });
  const [createGiftData, setCreateGiftData] = useState({
    acceptSimilar: false,
    priceRangeMin: '',
    priceRangeMax: '',
  });
  const [createScrapeLoading, setCreateScrapeLoading] = useState(false);
  const [createScrapeError, setCreateScrapeError] = useState('');
  const [createScrapeDone, setCreateScrapeDone] = useState(false);
  const [giftFormData, setGiftFormData] = useState({
    acceptSimilar: false,
    priceRangeMin: '',
    priceRangeMax: '',
    providerIds: [],
  });
  const [editArticleData, setEditArticleData] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    imageUrls: [],
    newImageUrl: '',
  });

  const getArticleProviders = (article) => {
    if (!article) return [];
    if (Array.isArray(article.articleProviders)) {
      return article.articleProviders
        .map((ap) => ap.provider)
        .filter(Boolean);
    }
    if (Array.isArray(article.providers)) {
      return article.providers;
    }
    return [];
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (babyId && user) {
      fetchGiftItems();
    }
  }, [babyId, user]);

  const fetchGiftItems = async () => {
    try {
      const response = await fetch(`/api/babies/${babyId}/gifts`);
      if (response.ok) {
        const data = await response.json();
        setGiftItems(data);
      }
    } catch (error) {
      console.error('Error fetching gift items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleSelect = (article) => {
    const articleProviders = getArticleProviders(article);
    setSelectedArticle(article);
    setShowCreateForm(false);
    setShowAddForm(true);
    setGiftFormData({
      acceptSimilar: false,
      priceRangeMin: '',
      priceRangeMax: '',
      providerIds: articleProviders.map((p) => p.id),
    });
  };

  const handleCreateNew = (queryText) => {
    setShowAddForm(false);
    setSelectedArticle(null);
    setEditingGiftId(null);
    setCreateFormData({
      name: queryText,
      description: '',
      url: '',
      imageUrls: '',
      category: '',
      brand: '',
      price: '',
      providerImageUrl: '',
      providerDetails: '',
    });
    setCreateGiftData({
      acceptSimilar: false,
      priceRangeMin: '',
      priceRangeMax: '',
    });
    setCreateScrapeError('');
    setCreateScrapeDone(false);
    setShowCreateForm(true);
  };

  const parseImageUrls = (value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

  const handleScrape = async () => {
    if (!createFormData.url) {
      setCreateScrapeError(t('gifts.addUrlFirst'));
      return;
    }
    setCreateScrapeLoading(true);
    setCreateScrapeError('');
    try {
      const response = await fetch('/api/articles/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: createFormData.url }),
      });
      if (!response.ok) {
        const error = await response.json();
        setCreateScrapeError(error.error || t('gifts.scrapeFailed'));
        return;
      }
      const data = await response.json();
      setCreateFormData((prev) => ({
        ...prev,
        name: prev.name || data.name || '',
        description: prev.description || data.description || '',
        category: prev.category || data.category || '',
        brand: prev.brand || data.brand || '',
        imageUrls:
          prev.imageUrls ||
          (Array.isArray(data.imageUrls) && data.imageUrls.length > 0
            ? data.imageUrls.join(', ')
            : ''),
        price:
          prev.price !== ''
            ? prev.price
            : typeof data.price === 'number'
              ? data.price.toString()
              : '',
        providerImageUrl:
          prev.providerImageUrl ||
          (Array.isArray(data.imageUrls) && data.imageUrls.length > 0
            ? data.imageUrls[0]
            : ''),
        providerDetails: prev.providerDetails || data.description || '',
      }));
      setCreateScrapeDone(true);
    } catch (error) {
      console.error('Error scraping article:', error);
      setCreateScrapeError(t('gifts.scrapeFailed'));
    } finally {
      setCreateScrapeLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const imageUrls = createFormData.imageUrls
        ? parseImageUrls(createFormData.imageUrls)
        : [];
      const providerPrice =
        createFormData.price !== '' ? parseFloat(createFormData.price) : null;
      const response = await fetch('/api/articles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createFormData.name,
          description: createFormData.description || null,
          url: createFormData.url || null,
          imageUrls,
          category: createFormData.category || null,
          brand: createFormData.brand || null,
          providerPrice,
          providerDetails: createFormData.providerDetails || null,
          providerImageUrl: createFormData.providerImageUrl || null,
          skipScrape: createScrapeDone,
          userId: user?.uid,
        }),
      });

      if (response.ok) {
        const article = await response.json();
        const providerIds =
          article.articleProviders?.map((ap) => ap.providerId || ap.provider?.id) || [];
        const giftResponse = await fetch(`/api/babies/${babyId}/gifts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: article.id,
            acceptSimilar: createGiftData.acceptSimilar,
            priceRangeMin: createGiftData.priceRangeMin
              ? parseFloat(createGiftData.priceRangeMin)
              : null,
            priceRangeMax: createGiftData.priceRangeMax
              ? parseFloat(createGiftData.priceRangeMax)
              : null,
            providerIds,
          }),
        });

        if (giftResponse.ok) {
          const newGift = await giftResponse.json();
          setGiftItems([...giftItems, newGift]);
          setShowCreateForm(false);
          setCreateFormData({
            name: '',
            description: '',
            url: '',
            imageUrls: '',
            category: '',
            brand: '',
            price: '',
            providerImageUrl: '',
            providerDetails: '',
          });
          setCreateGiftData({
            acceptSimilar: false,
            priceRangeMin: '',
            priceRangeMax: '',
          });
          setCreateScrapeError('');
          setCreateScrapeDone(false);
        } else {
          const error = await giftResponse.json();
          alert(error.error || t('gifts.addFailed'));
        }
      } else {
        const error = await response.json();
        alert(error.error || t('gifts.createFailed'));
      }
    } catch (error) {
      console.error('Error creating article:', error);
      alert(t('gifts.createFailed'));
    }
  };

  const handleAddGift = async (e) => {
    e.preventDefault();
    try {
      const isEditing = editingGiftId !== null;

      // When editing, also update the article fields
      if (isEditing && selectedArticle) {
        await fetch(`/api/articles/${selectedArticle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editArticleData.name || undefined,
            description: editArticleData.description || undefined,
            brand: editArticleData.brand || undefined,
            category: editArticleData.category || undefined,
            imageUrls: editArticleData.imageUrls.length > 0 ? editArticleData.imageUrls : undefined,
          }),
        });
      }

      const url = isEditing
        ? `/api/babies/${babyId}/gifts/${editingGiftId}`
        : `/api/babies/${babyId}/gifts`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? {} : { articleId: selectedArticle.id }),
          acceptSimilar: giftFormData.acceptSimilar,
          priceRangeMin: giftFormData.priceRangeMin
            ? parseFloat(giftFormData.priceRangeMin)
            : null,
          priceRangeMax: giftFormData.priceRangeMax
            ? parseFloat(giftFormData.priceRangeMax)
            : null,
          providerIds: giftFormData.providerIds,
        }),
      });

      if (response.ok) {
        if (isEditing) {
          // Re-fetch to get updated article data
          await fetchGiftItems();
        } else {
          const newGift = await response.json();
          setGiftItems([...giftItems, newGift]);
        }
        setShowAddForm(false);
        setSelectedArticle(null);
        setEditingGiftId(null);
        setGiftFormData({
          acceptSimilar: false,
          priceRangeMin: '',
          priceRangeMax: '',
          providerIds: [],
        });
      } else {
        const error = await response.json();
        alert(error.error || (isEditing ? t('gifts.updateFailed') : t('gifts.addFailed')));
      }
    } catch (error) {
      console.error(`Error ${editingGiftId ? 'updating' : 'adding'} gift:`, error);
      alert(editingGiftId ? t('gifts.updateFailed') : t('gifts.addFailed'));
    }
  };

  const handleEdit = (giftItem) => {
    const article = giftItem.article;
    setSelectedArticle(article);
    setEditingGiftId(giftItem.id);
    setGiftFormData({
      acceptSimilar: giftItem.acceptSimilar || false,
      priceRangeMin: giftItem.priceRangeMin?.toString() || '',
      priceRangeMax: giftItem.priceRangeMax?.toString() || '',
      providerIds: giftItem.providerIds || [],
    });
    setEditArticleData({
      name: article?.name || '',
      description: article?.description || '',
      brand: article?.brand || '',
      category: article?.category || '',
      imageUrls: article?.imageUrls || [],
      newImageUrl: '',
    });
    setShowAddForm(true);
  };

  const handleRescrape = async (giftItem) => {
    const article = giftItem.article;
    const providerUrl = article?.articleProviders?.[0]?.buyUrl || article?.articleProviders?.[0]?.url;
    if (!providerUrl) {
      alert(t('gifts.rescanFailed'));
      return;
    }

    try {
      const response = await fetch('/api/articles/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: providerUrl }),
      });

      if (!response.ok) {
        alert(t('gifts.rescanFailed'));
        return;
      }

      const data = await response.json();

      // Update the article with new scraped data
      const updateRes = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || article.name,
          description: data.description || article.description,
          imageUrls: data.imageUrls?.length ? data.imageUrls : article.imageUrls,
          category: data.category || article.category,
          brand: data.brand || article.brand,
        }),
      });

      if (updateRes.ok) {
        await fetchGiftItems();
      } else {
        alert(t('gifts.rescanFailed'));
      }
    } catch (error) {
      console.error('Error re-scraping:', error);
      alert(t('gifts.rescanFailed'));
    }
  };

  const handleDelete = async (giftItem) => {
    if (!confirm(t('gifts.deleteConfirm'))) return;

    try {
      const response = await fetch(
        `/api/babies/${babyId}/gifts/${giftItem.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setGiftItems(giftItems.filter((item) => item.id !== giftItem.id));
      } else {
        alert(t('gifts.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting gift item:', error);
      alert('Failed to delete gift item');
    }
  };

  if (authLoading || loading) {
    return (
      <Layout gradient="from-pink-500 via-rose-500 to-orange-500">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout gradient="from-pink-500 via-rose-500 to-orange-500">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">{t('gifts.title')}</h1>

        {/* Add Gift Section */}
        <div className="relative z-20 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">{t('gifts.addGift')}</h2>
          <ArticleSearch
            onSelect={handleArticleSelect}
            onCreateNew={handleCreateNew}
          />
        </div>

        {/* Create New Product Form */}
        {showCreateForm && (
          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              {t('gifts.createNew')}
            </h2>
            <form onSubmit={handleCreateArticle}>
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('gifts.productUrl')}
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="url"
                      value={createFormData.url}
                      onChange={(e) => {
                        setCreateFormData({ ...createFormData, url: e.target.value });
                        setCreateScrapeDone(false);
                        setCreateScrapeError('');
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={handleScrape}
                      disabled={createScrapeLoading}
                      className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-60"
                    >
                      {createScrapeLoading && (
                        <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      )}
                      {createScrapeLoading ? t('gifts.scraping') : t('gifts.runScraping')}
                    </button>
                  </div>
                  {createScrapeError && (
                    <div className="text-red-300 text-sm mt-2">{createScrapeError}</div>
                  )}
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('gifts.productName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.brand')}
                    </label>
                    <input
                      type="text"
                      value={createFormData.brand}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, brand: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.category')}
                    </label>
                    <input
                      type="text"
                      value={createFormData.category}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('gifts.description')}
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('gifts.images')}
                  </label>
                  {parseImageUrls(createFormData.imageUrls).length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {parseImageUrls(createFormData.imageUrls).map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt={`${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-white/20" onError={(e) => { e.target.style.opacity = '0.3'; }} />
                          <button
                            type="button"
                            onClick={() => {
                              const urls = parseImageUrls(createFormData.imageUrls).filter((_, idx) => idx !== i);
                              setCreateFormData({ ...createFormData, imageUrls: urls.join(', ') });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm mb-3">{t('gifts.noImages')}</p>
                  )}
                  <input
                    type="text"
                    value={createFormData.imageUrls}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, imageUrls: e.target.value })
                    }
                    placeholder={t('gifts.imageUrls')}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.productPrice')} (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createFormData.price}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, price: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.providerImageUrl')}
                    </label>
                    <input
                      type="text"
                      value={createFormData.providerImageUrl}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          providerImageUrl: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">
                    {t('gifts.providerDetails')}
                  </label>
                  <textarea
                    value={createFormData.providerDetails}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        providerDetails: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createAcceptSimilar"
                    checked={createGiftData.acceptSimilar}
                    onChange={(e) =>
                      setCreateGiftData({
                        ...createGiftData,
                        acceptSimilar: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="createAcceptSimilar" className="text-white">
                    {t('gifts.acceptSimilar')}
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.minPrice')} (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createGiftData.priceRangeMin}
                      onChange={(e) =>
                        setCreateGiftData({
                          ...createGiftData,
                          priceRangeMin: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.maxPrice')} (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={createGiftData.priceRangeMax}
                      onChange={(e) =>
                        setCreateGiftData({
                          ...createGiftData,
                          priceRangeMax: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                  >
                    {t('gifts.createAndAdd')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateFormData({
                        name: '',
                        description: '',
                        url: '',
                        imageUrls: '',
                        category: '',
                        brand: '',
                        price: '',
                        providerImageUrl: '',
                        providerDetails: '',
                      });
                      setCreateGiftData({
                        acceptSimilar: false,
                        priceRangeMin: '',
                        priceRangeMax: '',
                      });
                      setCreateScrapeError('');
                      setCreateScrapeDone(false);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Configure / Edit Gift Modal */}
        {showAddForm && selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddForm(false); setSelectedArticle(null); setEditingGiftId(null); }}>
            <div className="bg-gradient-to-br from-pink-600/90 via-rose-500/90 to-orange-500/90 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-semibold text-white mb-4">
                {editingGiftId ? t('gifts.editGift') : t('gifts.configureGift')}: {selectedArticle.name}
              </h2>
              <form onSubmit={handleAddGift}>
                <div className="space-y-4">
                  {/* Product Details Section (when editing) */}
                  {editingGiftId && (
                    <>
                      <h3 className="text-lg font-medium text-white/90 border-b border-white/20 pb-2">
                        {t('gifts.productDetails')}
                      </h3>
                      <div>
                        <label className="block text-white font-medium mb-2">
                          {t('gifts.productName')}
                        </label>
                        <input
                          type="text"
                          value={editArticleData.name}
                          onChange={(e) => setEditArticleData({ ...editArticleData, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white font-medium mb-2">
                            {t('gifts.brand')}
                          </label>
                          <input
                            type="text"
                            value={editArticleData.brand}
                            onChange={(e) => setEditArticleData({ ...editArticleData, brand: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">
                            {t('gifts.category')}
                          </label>
                          <input
                            type="text"
                            value={editArticleData.category}
                            onChange={(e) => setEditArticleData({ ...editArticleData, category: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2">
                          {t('gifts.description')}
                        </label>
                        <textarea
                          value={editArticleData.description}
                          onChange={(e) => setEditArticleData({ ...editArticleData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                        />
                      </div>
                      {/* Image management */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          {t('gifts.images')}
                        </label>
                        {editArticleData.imageUrls.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {editArticleData.imageUrls.map((img, i) => (
                              <div key={i} className="relative group">
                                <img src={img} alt={`${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-white/20" onError={(e) => { e.target.style.opacity = '0.3'; }} />
                                <button
                                  type="button"
                                  onClick={() => setEditArticleData({ ...editArticleData, imageUrls: editArticleData.imageUrls.filter((_, idx) => idx !== i) })}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/50 text-sm mb-3">{t('gifts.noImages')}</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editArticleData.newImageUrl}
                            onChange={(e) => setEditArticleData({ ...editArticleData, newImageUrl: e.target.value })}
                            placeholder={t('gifts.addImageUrl')}
                            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editArticleData.newImageUrl.trim()) {
                                setEditArticleData({ ...editArticleData, imageUrls: [...editArticleData.imageUrls, editArticleData.newImageUrl.trim()], newImageUrl: '' });
                              }
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all text-sm"
                          >
                            {t('gifts.add')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Gift Settings Section */}
                  {editingGiftId && (
                    <h3 className="text-lg font-medium text-white/90 border-b border-white/20 pb-2 pt-2">
                      {t('gifts.giftSettings')}
                    </h3>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="acceptSimilar"
                      checked={giftFormData.acceptSimilar}
                      onChange={(e) =>
                        setGiftFormData({
                          ...giftFormData,
                          acceptSimilar: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded"
                    />
                    <label htmlFor="acceptSimilar" className="text-white">
                      {t('gifts.acceptSimilar')}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        {t('gifts.minPrice')} (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={giftFormData.priceRangeMin}
                        onChange={(e) =>
                          setGiftFormData({
                            ...giftFormData,
                            priceRangeMin: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">
                        {t('gifts.maxPrice')} (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={giftFormData.priceRangeMax}
                        onChange={(e) =>
                          setGiftFormData({
                            ...giftFormData,
                            priceRangeMax: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">
                      {t('gifts.providers')}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {getArticleProviders(selectedArticle).length === 0 ? (
                        <div className="text-white/60 text-sm">
                          {t('gifts.noProviders')}
                        </div>
                      ) : (
                        getArticleProviders(selectedArticle).map((provider) => (
                          <div key={provider.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`provider-${provider.id}`}
                              checked={giftFormData.providerIds.includes(provider.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGiftFormData({
                                    ...giftFormData,
                                    providerIds: [
                                      ...giftFormData.providerIds,
                                      provider.id,
                                    ],
                                  });
                                } else {
                                  setGiftFormData({
                                    ...giftFormData,
                                    providerIds: giftFormData.providerIds.filter(
                                      (id) => id !== provider.id
                                    ),
                                  });
                                }
                              }}
                              className="w-5 h-5 rounded"
                            />
                            <label
                              htmlFor={`provider-${provider.id}`}
                              className="text-white"
                            >
                              {provider.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                    >
                      {editingGiftId ? t('gifts.updateGift') : t('gifts.addToRegistry')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedArticle(null);
                        setEditingGiftId(null);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Gift Items Grid */}
        {giftItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">
              {t('gifts.noGifts')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftItems.map((item) => (
              <GiftCard
                key={item.id}
                giftItem={item}
                isOwner={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRescrape={handleRescrape}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GiftRegistry;
