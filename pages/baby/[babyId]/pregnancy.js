import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import PregnancyCountdown from '../../../components/PregnancyCountdown';
import WeeklyInfo from '../../../components/WeeklyInfo';
import pregnancyWeeksData from '../../../data/pregnancy-weeks.json';
import pregnancyWeeksDataEs from '../../../data/pregnancy-weeks-es.json';

const PregnancyTracker = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { babyId } = router.query;
  const [pregnancyData, setPregnancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeekView, setCurrentWeekView] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch pregnancy data
  useEffect(() => {
    if (babyId && user) {
      fetchPregnancyData();
    }
  }, [babyId, user]);

  const fetchPregnancyData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/babies/${babyId}/pregnancy`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch pregnancy data');
      }

      const data = await res.json();
      setPregnancyData(data);
      setCurrentWeekView(data.currentWeek);
      setIsPublic(data.isPublic || false);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching pregnancy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublic = async (e) => {
    const newValue = e.target.checked;
    setSaving(true);
    try {
      const res = await fetch(`/api/babies/${babyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregnancyTrackerPublic: newValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      setIsPublic(newValue);
    } catch (err) {
      setError(err.message);
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleWeekChange = (direction) => {
    if (!pregnancyData) return;
    
    const newWeek = direction === 'next' 
      ? Math.min(currentWeekView + 1, 42)
      : Math.max(currentWeekView - 1, 1);
    
    setCurrentWeekView(newWeek);
  };

  const activePregnancyData = language === 'es' ? pregnancyWeeksDataEs : pregnancyWeeksData;

  const getWeekData = (week) => {
    return activePregnancyData.find((w) => w.week === week) || activePregnancyData[activePregnancyData.length - 1];
  };

  if (authLoading || loading) {
    return (
      <Layout gradient="from-violet-500 via-blue-500 to-teal-500">
        <div className="flex items-center justify-center min-h-[80vh] text-white">
          <div className="text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (error && !pregnancyData) {
    return (
      <Layout gradient="from-violet-500 via-blue-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-red-100">
            <h2 className="text-xl font-bold mb-2">{t('common.error')}</h2>
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pregnancyData) {
    return null;
  }

  const weekData = getWeekData(currentWeekView);

  return (
    <Layout gradient="from-violet-500 via-blue-500 to-teal-500">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
            {t('tracker.title')}
          </h1>
        </div>

        {/* Countdown */}
        <PregnancyCountdown
          daysRemaining={pregnancyData.daysRemaining}
          progressPercent={pregnancyData.progressPercent}
          currentWeek={pregnancyData.currentWeek}
          dueDate={pregnancyData.dueDate}
        />

        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-4 my-8">
          <button
            onClick={() => handleWeekChange('prev')}
            disabled={currentWeekView <= 1}
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            ← {t('tracker.previousWeek')}
          </button>
          <div className="text-white/80 font-medium">
            {currentWeekView === pregnancyData.currentWeek ? t('tracker.currentWeek') : t('tracker.weekLabel', { week: currentWeekView })}
          </div>
          <button
            onClick={() => handleWeekChange('next')}
            disabled={currentWeekView >= 42}
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {t('tracker.nextWeek')} →
          </button>
        </div>

        {/* Weekly Info Card */}
        <WeeklyInfo weekData={weekData} />

        {/* Settings Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-md">{t('tracker.settings')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{t('tracker.publicTitle')}</h3>
              <p className="text-white/70 text-sm">
                {t('tracker.publicDesc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={handleTogglePublic}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PregnancyTracker;
