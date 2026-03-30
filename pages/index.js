import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

const Home = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  return (
    <Layout gradient="from-purple-500 via-pink-500 to-rose-500">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
            Revel.Baby
          </h1>
          <p className="text-xl text-white/90 mb-2">
            {t('home.tagline')}
          </p>
          <p className="text-white/70 mb-10 max-w-md mx-auto">
            {t('home.description')}
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/create"
                className="bg-white text-purple-600 py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg"
              >
                {t('home.getStarted')}
              </Link>
              <Link
                href="/login"
                className="bg-white/20 backdrop-blur text-white py-3 px-8 rounded-full hover:bg-white/30 transition-all font-medium text-lg border border-white/30"
              >
                {t('home.signIn')}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg">{t('home.welcomeBack', { name: user.displayName || user.email })}</p>
              <Link
                href="/dashboard"
                className="bg-white text-purple-600 py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg"
              >
                {t('common.goDashboard')}
              </Link>
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-bold text-lg mb-2">{t('home.giftRegistry')}</h3>
            <p className="text-white/70 text-sm">{t('home.giftRegistryDesc')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
            <div className="text-4xl mb-3">🤰</div>
            <h3 className="font-bold text-lg mb-2">{t('home.pregnancyTracker')}</h3>
            <p className="text-white/70 text-sm">{t('home.pregnancyTrackerDesc')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/20 transition-all">
            <div className="text-4xl mb-3">🎰</div>
            <h3 className="font-bold text-lg mb-2">{t('home.birthBetting')}</h3>
            <p className="text-white/70 text-sm">{t('home.birthBettingDesc')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
