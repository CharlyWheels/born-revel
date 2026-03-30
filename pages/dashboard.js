import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [babies, setBabies] = useState([]);
  const [loadingBabies, setLoadingBabies] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dueDate: '',
    customSlug: '',
  });
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch babies
  useEffect(() => {
    if (user?.uid) {
      fetchBabies();
    }
  }, [user]);

  const fetchBabies = async () => {
    try {
      setLoadingBabies(true);
      const res = await fetch(`/api/babies/my-babies?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setBabies(data);
      } else {
        console.error('Failed to fetch babies');
      }
    } catch (err) {
      console.error('Error fetching babies:', err);
    } finally {
      setLoadingBabies(false);
    }
  };

  const handleCreateBaby = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const res = await fetch('/api/babies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          dueDate: formData.dueDate,
          customSlug: formData.customSlug,
          userId: user.uid,
          email: user.email,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({ name: '', dueDate: '', customSlug: '' });
        fetchBabies(); // Refresh list
      } else {
        setError(data?.error || `Server error (${res.status})`);
      }
    } catch (err) {
      setError(`An error occurred: ${err.message}`);
      console.error('Error creating baby:', err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading || loadingBabies) {
    return (
      <Layout gradient="from-purple-500 via-pink-500 to-rose-500">
        <div className="flex items-center justify-center min-h-[80vh] text-white">
          <div className="text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <Layout gradient="from-purple-500 via-pink-500 to-rose-500">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">{t('dashboard.myBabies')}</h1>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-purple-600 py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
            >
              {t('dashboard.createBaby')}
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">{t('dashboard.createNew')}</h2>
            <form onSubmit={handleCreateBaby} className="space-y-4">
              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('dashboard.babyName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder={t('dashboard.enterBabyName')}
                />
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('dashboard.dueDate')}</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('dashboard.customUrl')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-sm">revel.baby/b/</span>
                  <input
                    type="text"
                    value={formData.customSlug}
                    onChange={(e) => setFormData({ ...formData, customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="your-slug"
                  />
                </div>
                {formData.customSlug && (
                  <p className="text-white/60 text-sm mt-1">{t('dashboard.previewSlug', { slug: formData.customSlug })}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-100 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-white text-purple-600 py-2 px-6 rounded-full font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {creating ? t('dashboard.creating') : t('dashboard.createBabyBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: '', dueDate: '', customSlug: '' });
                    setError('');
                  }}
                  className="bg-white/20 text-white py-2 px-6 rounded-full font-semibold hover:bg-white/30 transition-all border border-white/30"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {babies.length === 0 && !showCreateForm ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('dashboard.noBabies')}</h2>
            <p className="text-white/70 mb-6">{t('dashboard.noBabiesDesc')}</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white text-purple-600 py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
            >
              {t('dashboard.createFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {babies.map((baby) => (
              <Link
                key={baby.id}
                href={`/baby/${baby.id}/settings`}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer"
              >
                <h3 className="text-2xl font-bold text-white mb-2">{baby.name}</h3>
                <p className="text-white/70 mb-4">{t('dashboard.due', { date: formatDate(baby.dueDate) })}</p>
                <p className="text-white/60 text-sm mb-4">revel.baby/b/{baby.customSlug}</p>

                <div className="flex gap-2 mb-4">
                  {baby.giftRegistryEnabled && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">🎁 {t('dashboard.giftRegistryBadge')}</span>
                  )}
                  {baby.pregnancyTrackerEnabled && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">🤰 {t('dashboard.trackerBadge')}</span>
                  )}
                  {baby.birthBettingEnabled && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">🎰 {t('dashboard.bettingBadge')}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-white/70">
                    <span>🎁 {t('dashboard.gifts', { count: baby._count?.giftItems || 0 })}</span>
                    <span>🎰 {t('dashboard.bets', { count: baby._count?.bets || 0 })}</span>
                  </div>
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/baby/${baby.id}/settings`);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                  >
                    👥 {t('dashboard.invite')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
