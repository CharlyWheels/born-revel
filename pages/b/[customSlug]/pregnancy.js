import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import PregnancyCountdown from '../../../components/PregnancyCountdown';
import WeeklyInfo from '../../../components/WeeklyInfo';
import pregnancyData from '../../../data/pregnancy-weeks.json';
import pregnancyDataEs from '../../../data/pregnancy-weeks-es.json';
import { useLanguage } from '../../../context/LanguageContext';

const PublicPregnancyTracker = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { customSlug } = router.query;
  const [publicData, setPublicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekData, setWeekData] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (customSlug) {
      fetchPublicData();
    }
  }, [customSlug]);

  useEffect(() => {
    if (publicData?.pregnancyTracker) {
      calculatePregnancyProgress();
    }
  }, [publicData]);

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/public/${customSlug}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch public data');
      }

      const data = await res.json();
      setPublicData(data);

      if (!data.pregnancyTracker || !data.pregnancyTracker.enabled) {
        setError(t('tracker.notPublic'));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching public data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePregnancyProgress = () => {
    if (!publicData?.pregnancyTracker) return;

    const tracker = publicData.pregnancyTracker;
    const dueDate = new Date(tracker.dueDate);
    const now = new Date();

    // Standard pregnancy is 280 days
    const pregnancyStartDate = tracker.pregnancyStartDate
      ? new Date(tracker.pregnancyStartDate)
      : new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);

    const daysSinceStart = Math.floor((now - pregnancyStartDate) / (1000 * 60 * 60 * 24));
    const week = Math.min(Math.max(Math.floor(daysSinceStart / 7) + 1, 1), 42);
    
    const remaining = Math.max(Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)), 0);
    const totalDays = 280;
    const elapsed = totalDays - remaining;
    const progress = Math.min(Math.round((elapsed / totalDays) * 100), 100);

    setCurrentWeek(week);
    setDaysRemaining(remaining);
    setProgressPercent(progress);

    // Get week data
    const activePregnancyData = language === 'es' ? pregnancyDataEs : pregnancyData;
    const weekInfo = activePregnancyData.find((w) => w.week === week) || activePregnancyData[activePregnancyData.length - 1];
    setWeekData(weekInfo);
  };

  const getTrimesterWeeks = () => {
    return {
      t1: { start: 1, end: 13, label: t('publicPregnancy.trimester1') },
      t2: { start: 14, end: 27, label: t('publicPregnancy.trimester2') },
      t3: { start: 28, end: 42, label: t('publicPregnancy.trimester3') },
    };
  };

  const getTrimesterProgress = () => {
    if (!currentWeek) return { t1: 0, t2: 0, t3: 0 };
    
    const trimesters = getTrimesterWeeks();
    return {
      t1: currentWeek >= trimesters.t1.end ? 100 : currentWeek >= trimesters.t1.start 
        ? ((currentWeek - trimesters.t1.start + 1) / (trimesters.t1.end - trimesters.t1.start + 1)) * 100 
        : 0,
      t2: currentWeek >= trimesters.t2.end ? 100 : currentWeek >= trimesters.t2.start 
        ? ((currentWeek - trimesters.t2.start + 1) / (trimesters.t2.end - trimesters.t2.start + 1)) * 100 
        : 0,
      t3: currentWeek >= trimesters.t3.end ? 100 : currentWeek >= trimesters.t3.start 
        ? ((currentWeek - trimesters.t3.start + 1) / (trimesters.t3.end - trimesters.t3.start + 1)) * 100 
        : 0,
    };
  };

  if (loading) {
    return (
      <Layout gradient="from-violet-500 via-blue-500 to-teal-500">
        <div className="flex items-center justify-center min-h-[80vh] text-white">
          <div className="text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error || !publicData?.pregnancyTracker?.enabled) {
    return (
      <Layout gradient="from-violet-500 via-blue-500 to-teal-500">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('tracker.notAvailable')}</h2>
            <p className="text-white/70">
              {error || t('tracker.notPublic')}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const trimesterProgress = getTrimesterProgress();
  const trimesters = getTrimesterWeeks();

  return (
    <Layout gradient="from-violet-500 via-blue-500 to-teal-500">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Arrow */}
        <Link href={`/b/${customSlug}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span>{t('publicBaby.backToMain', { name: publicData.name })}</span>
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg mb-2">
            {t('publicPregnancy.journey', { name: publicData.name })}
          </h1>
        </div>

        {/* Countdown */}
        {currentWeek && (
          <PregnancyCountdown
            daysRemaining={daysRemaining}
            progressPercent={progressPercent}
            currentWeek={currentWeek}
            dueDate={publicData.pregnancyTracker.dueDate}
          />
        )}

        {/* Weekly Info Card */}
        {weekData && <WeeklyInfo weekData={weekData} />}

        {/* Trimester Timeline */}
        <div className="mt-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-md text-center">
            {t('publicPregnancy.timeline')}
          </h2>
          
          <div className="space-y-6">
            {/* Trimester 1 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-100 font-semibold">{trimesters.t1.label}</span>
                <span className="text-white/70 text-sm">{t('publicPregnancy.weeks', { start: trimesters.t1.start, end: trimesters.t1.end })}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(trimesterProgress.t1, 100)}%` }}
                />
              </div>
            </div>

            {/* Trimester 2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 font-semibold">{trimesters.t2.label}</span>
                <span className="text-white/70 text-sm">{t('publicPregnancy.weeks', { start: trimesters.t2.start, end: trimesters.t2.end })}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(trimesterProgress.t2, 100)}%` }}
                />
              </div>
            </div>

            {/* Trimester 3 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-teal-100 font-semibold">{trimesters.t3.label}</span>
                <span className="text-white/70 text-sm">{t('publicPregnancy.weeks', { start: trimesters.t3.start, end: trimesters.t3.end })}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(trimesterProgress.t3, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PublicPregnancyTracker;
