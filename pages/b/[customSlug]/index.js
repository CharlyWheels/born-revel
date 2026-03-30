import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useLanguage } from '../../../context/LanguageContext';

const PublicBabyPage = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { customSlug } = router.query;
  const [babyData, setBabyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customSlug) {
      fetchBabyData();
    }
  }, [customSlug]);

  const fetchBabyData = async () => {
    try {
      const res = await fetch(`/api/public/${customSlug}`);
      if (res.ok) {
        const data = await res.json();
        setBabyData(data);
      } else if (res.status === 404) {
        setError(t('publicBaby.pageNotFound'));
      } else {
        setError(t('publicBaby.somethingWrong'));
      }
    } catch (err) {
      console.error('Error fetching baby data:', err);
      setError(t('publicBaby.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const daysUntilDue = (dateStr) => {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <Layout gradient="from-purple-500 via-pink-500 to-rose-500">
        <div className="flex items-center justify-center min-h-[80vh] text-white">
          <div className="text-xl animate-pulse">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error || !babyData) {
    return (
      <Layout gradient="from-gray-500 via-gray-600 to-gray-700">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">{error || t('publicBaby.pageNotFound')}</h1>
          <p className="text-white/70 mb-6">{t('publicBaby.pageRemoved')}</p>
          <Link href="/" className="bg-white text-gray-700 py-2 px-6 rounded-full font-medium hover:bg-white/90 transition">
            {t('common.goHome')}
          </Link>
        </div>
      </Layout>
    );
  }

  const remaining = daysUntilDue(babyData.dueDate);

  return (
    <Layout gradient="from-purple-500 via-pink-500 to-rose-500">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-3">
            {babyData.name}
          </h1>
          {babyData.owners && babyData.owners.length > 0 && (
            <p className="text-white/80 text-lg mb-4">
              By {babyData.owners.map((o) => o.name || 'Parent').join(' & ')}
            </p>
          )}
          {babyData.dueDate && (
            <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4">
              <p className="text-white/70 text-sm">{t('publicBaby.expectedArrival')}</p>
              <p className="text-white text-xl font-bold">{formatDate(babyData.dueDate)}</p>
              {remaining !== null && remaining > 0 && (
                <p className="text-white/80 text-sm mt-1">{t('publicBaby.daysToGo', { count: remaining })}</p>
              )}
              {remaining === 0 && (
                <p className="text-yellow-200 text-sm mt-1 font-medium">{t('publicBaby.anyDayNow')}</p>
              )}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {babyData.giftRegistry?.enabled && (
            <Link
              href={`/b/${customSlug}/gifts`}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-4">🎁</div>
              <h2 className="text-xl font-bold text-white mb-2">{t('home.giftRegistry')}</h2>
              <p className="text-white/70 text-sm">
                {t('publicBaby.giftRegistryDesc')}
              </p>
              {babyData.giftRegistry.items && (
                <p className="text-white/50 text-xs mt-3">
                  {t('publicBaby.giftsAvailable', { count: babyData.giftRegistry.items.filter((i) => i.status === 'available').length })}
                </p>
              )}
            </Link>
          )}

          {babyData.pregnancyTracker?.enabled && (
            <Link
              href={`/b/${customSlug}/pregnancy`}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-4">🤰</div>
              <h2 className="text-xl font-bold text-white mb-2">{t('home.pregnancyTracker')}</h2>
              <p className="text-white/70 text-sm">
                {t('publicBaby.pregnancyTrackerDesc')}
              </p>
            </Link>
          )}

          {babyData.birthBetting?.enabled && (
            <Link
              href={`/b/${customSlug}/bets`}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center hover:bg-white/20 hover:scale-105 transition-all"
            >
              <div className="text-5xl mb-4">🎰</div>
              <h2 className="text-xl font-bold text-white mb-2">{t('home.birthBetting')}</h2>
              <p className="text-white/70 text-sm">
                {t('publicBaby.birthBettingDesc')}
              </p>
              {babyData.birthBetting.bets && (
                <p className="text-white/50 text-xs mt-3">
                  {t('publicBaby.betsPlaced', { count: babyData.birthBetting.bets.filter((b) => b.verified).length })}
                </p>
              )}
            </Link>
          )}
        </div>

        {/* No features enabled */}
        {!babyData.giftRegistry?.enabled &&
          !babyData.pregnancyTracker?.enabled &&
          !babyData.birthBetting?.enabled && (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">
                {t('publicBaby.checkBackSoon')}
              </p>
            </div>
          )}
      </div>
    </Layout>
  );
};

export default PublicBabyPage;
