import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import BettingCalendar from '../../../components/BettingCalendar';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../../lib/apiClient';

const BabyBetsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { babyId } = router.query;

  const [bets, setBets] = useState([]);
  const [settings, setSettings] = useState({});
  const [dueDate, setDueDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch bets data
  useEffect(() => {
    if (babyId && user) {
      fetchBets();
    }
  }, [babyId, user]);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/babies/${babyId}/bets`);
      if (res.ok) {
        const data = await res.json();
        setBets(data.bets || []);
        setSettings(data.settings || {});
        setDueDate(data.dueDate);
      } else {
        console.error('Failed to fetch bets');
      }
    } catch (err) {
      console.error('Error fetching bets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBet = async (betId, approved) => {
    try {
      setVerifying({ ...verifying, [betId]: true });
      const res = await apiFetch(`/api/babies/${babyId}/bets/${betId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ approved }),
      });

      if (res.ok) {
        await fetchBets(); // Refresh bets
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to verify bet');
      }
    } catch (err) {
      console.error('Error verifying bet:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setVerifying({ ...verifying, [betId]: false });
    }
  };

  const pendingBets = bets.filter(bet => !bet.verified);
  const verifiedBets = bets.filter(bet => bet.verified);

  if (authLoading || loading) {
    return (
      <Layout gradient="from-emerald-500 via-green-500 to-yellow-500">
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
    <Layout gradient="from-emerald-500 via-green-500 to-yellow-500">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-white/80 hover:text-white transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('common.back')}
          </button>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">{t('adminBets.title')}</h1>
          <p className="text-white/80">{t('adminBets.subtitle')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">{t('adminBets.totalBets')}</p>
            <p className="text-3xl font-bold text-white">{bets.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">{t('adminBets.verified')}</p>
            <p className="text-3xl font-bold text-green-300">{verifiedBets.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <p className="text-white/70 text-sm mb-1">{t('adminBets.pending')}</p>
            <p className="text-3xl font-bold text-amber-300">{pendingBets.length}</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <BettingCalendar
            bets={bets}
            dueDate={dueDate}
            settings={settings}
            isOwner={true}
          />
        </div>

        {/* Pending Bets List */}
        {pendingBets.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">{t('adminBets.pendingBets')}</h2>
            <div className="space-y-3">
              {pendingBets.map((bet) => {
                const betDate = new Date(bet.betDate);
                const betDateEnd = bet.betDateEnd ? new Date(bet.betDateEnd) : null;
                return (
                  <div
                    key={bet.id}
                    className="bg-white/10 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">{bet.betterName}</p>
                      <p className="text-white/70 text-sm">
                        {t('adminBets.date', { date: betDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })}
                        {betDateEnd && (
                          <span> - {betDateEnd.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        )}
                      </p>
                      {bet.betterEmail && (
                        <p className="text-white/60 text-sm">{t('adminBets.email', { email: bet.betterEmail })}</p>
                      )}
                      <p className="text-white/60 text-sm">
                        {t('adminBets.submitted', { date: new Date(bet.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyBet(bet.id, true)}
                        disabled={verifying[bet.id]}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifying[bet.id] ? t('adminBets.verifying') : t('adminBets.approve')}
                      </button>
                      <button
                        onClick={() => handleVerifyBet(bet.id, false)}
                        disabled={verifying[bet.id]}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifying[bet.id] ? t('adminBets.rejecting') : t('adminBets.reject')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pendingBets.length === 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <p className="text-white/70 text-lg">{t('adminBets.noPending')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BabyBetsPage;
