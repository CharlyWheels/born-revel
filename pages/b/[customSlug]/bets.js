import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import BettingCalendar from '../../../components/BettingCalendar';
import PlaceBetModal from '../../../components/PlaceBetModal';
import { useLanguage } from '../../../context/LanguageContext';

const PublicBetsPage = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { customSlug } = router.query;

  const [babyData, setBabyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch public baby data
  useEffect(() => {
    if (customSlug) {
      fetchBabyData();
    }
  }, [customSlug]);

  const fetchBabyData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/public/${customSlug}`);
      if (res.ok) {
        const data = await res.json();
        setBabyData(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load page');
      }
    } catch (err) {
      console.error('Error fetching baby data:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowModal(true);
    setError('');
    setSuccessMessage('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  const handleConfirmBet = async (betData) => {
    try {
      setSubmitting(true);
      setError('');
      
      const res = await fetch(`/api/babies/${babyData.id}/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betterName: betData.betterName,
          betterEmail: betData.betterEmail,
          betDate: betData.betDate.toISOString(),
          betDateEnd: betData.betDateEnd ? betData.betDateEnd.toISOString() : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(t('publicBets.success'));
        setShowModal(false);
        setSelectedDate(null);
        // Refresh data to show the new bet
        await fetchBabyData();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(data.error || t('bet.failed'));
      }
    } catch (err) {
      setError(err.message || 'Failed to place bet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout gradient="from-emerald-500 via-green-500 to-yellow-500">
        <div className="flex items-center justify-center min-h-[80vh] text-white">
          <div className="text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (error && !babyData) {
    return (
      <Layout gradient="from-emerald-500 via-green-500 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-8 text-center">
            <p className="text-white text-lg">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const birthBetting = babyData?.birthBetting;
  const bettingEnabled = birthBetting?.enabled;
  const settings = birthBetting?.settings || {};
  const bets = birthBetting?.bets || [];
  const paymentConfig = birthBetting?.paymentConfig;

  if (!bettingEnabled) {
    return (
      <Layout gradient="from-emerald-500 via-green-500 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">{babyData?.name}</h1>
            <p className="text-white/70 text-lg">{t('publicBets.notAvailable')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout gradient="from-emerald-500 via-green-500 to-yellow-500">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Arrow */}
        <Link href={`/b/${customSlug}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span>{t('publicBaby.backToMain', { name: babyData?.name })}</span>
        </Link>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">{babyData?.name}</h1>
          <p className="text-white/80 text-lg">{t('publicBets.placeBet')}</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
            <p className="text-white font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-white">{error}</p>
          </div>
        )}

        {/* Bet Amount & Payment Info */}
        {(settings.betAmount || paymentConfig) && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
            {settings.betAmount && (
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">{t('publicBets.betAmount')}</h2>
                <p className="text-3xl font-bold text-yellow-300">{settings.betAmount} EUR</p>
              </div>
            )}

            {paymentConfig && (
              <div>
                <h2 className="text-xl font-bold text-white mb-3">{t('publicBets.paymentMethods')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentConfig.methods?.bizum?.enabled && paymentConfig.methods.bizum.phone && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white font-semibold mb-1">{t('settings.bizum')}</p>
                      <p className="text-white/80">{paymentConfig.methods.bizum.phone}</p>
                    </div>
                  )}

                  {paymentConfig.methods?.bankAccount?.enabled && paymentConfig.methods.bankAccount.iban && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white font-semibold mb-1">{t('publicBets.bankTransfer')}</p>
                      <p className="text-white/80 break-all text-sm">{paymentConfig.methods.bankAccount.iban}</p>
                    </div>
                  )}

                  {paymentConfig.methods?.paypal?.enabled && paymentConfig.methods.paypal.email && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white font-semibold mb-1">{t('settings.paypal')}</p>
                      <p className="text-white/80">{paymentConfig.methods.paypal.email}</p>
                    </div>
                  )}

                  {paymentConfig.methods?.cash?.enabled && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-white font-semibold mb-1">{t('settings.cash')}</p>
                      <p className="text-white/80">{t('publicBets.payInPerson')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Calendar */}
        <div className="mb-8">
          <BettingCalendar
            bets={bets}
            dueDate={babyData?.dueDate}
            settings={settings}
            onSelectDate={handleDateSelect}
            isOwner={false}
          />
        </div>

        {/* Modal */}
        {showModal && selectedDate && (
          <PlaceBetModal
            selectedDate={selectedDate}
            paymentConfig={paymentConfig}
            settings={settings}
            onClose={handleCloseModal}
            onConfirm={handleConfirmBet}
          />
        )}
      </div>
    </Layout>
  );
};

export default PublicBetsPage;
