import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const PlaceBetModal = ({ selectedDate, paymentConfig, settings = {}, onClose, onConfirm }) => {
  const { t, language } = useLanguage();
  const [betterName, setBetterName] = useState('');
  const [betterEmail, setBetterEmail] = useState('');
  const [betDateEnd, setBetDateEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset form when modal opens/closes
    if (selectedDate) {
      setBetterName('');
      setBetterEmail('');
      setBetDateEnd('');
      setError('');
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!selectedDate) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onConfirm({
        betterName,
        betterEmail: betterEmail || null,
        betDate: selectedDate,
        betDateEnd: betDateEnd ? new Date(betDateEnd) : null,
      });
      // Reset form on success
      setBetterName('');
      setBetterEmail('');
      setBetDateEnd('');
    } catch (err) {
      setError(err.message || t('bet.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const paymentMethods = paymentConfig?.methods || {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{t('bet.placeYourBet')}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-600"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selected Date */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 mb-6 text-white text-center">
            <p className="text-sm font-medium mb-1">{t('bet.selectedDate')}</p>
            <p className="text-xl font-bold">{formatDate(selectedDate)}</p>
          </div>

          {/* Bet Amount */}
          {settings.betAmount && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-lg font-semibold text-gray-800">
                {t('bet.betAmount', { amount: settings.betAmount })}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('bet.yourName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={betterName}
                onChange={(e) => setBetterName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t('bet.enterName')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('bet.nameHint')}</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('bet.emailOptional')}
              </label>
              <input
                type="email"
                value={betterEmail}
                onChange={(e) => setBetterEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">{t('bet.emailHint')}</p>
            </div>

            {/* Date Range */}
            {settings.allowRange && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('bet.endDate')}
                </label>
                <input
                  type="date"
                  value={betDateEnd}
                  onChange={(e) => setBetDateEnd(e.target.value)}
                  min={selectedDate.toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Payment Info */}
            {paymentConfig && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 mb-2">{t('bet.paymentInstructions')}</h3>
                
                {paymentMethods.bizum?.enabled && paymentMethods.bizum?.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('bet.bizum')}</p>
                    <p className="text-sm text-gray-600">{t('bet.phone', { phone: paymentMethods.bizum.phone })}</p>
                  </div>
                )}

                {paymentMethods.bankAccount?.enabled && paymentMethods.bankAccount?.iban && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('bet.bankTransfer')}</p>
                    <p className="text-sm text-gray-600 break-all">{paymentMethods.bankAccount.iban}</p>
                  </div>
                )}

                {paymentMethods.paypal?.enabled && paymentMethods.paypal?.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('bet.paypal')}</p>
                    <p className="text-sm text-gray-600">{paymentMethods.paypal.email}</p>
                  </div>
                )}

                {paymentMethods.cash?.enabled && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t('bet.cash')}</p>
                    <p className="text-sm text-gray-600">{t('bet.payInPerson')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Text */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>{t('bet.noteLabel')}</strong> {t('bet.note')}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t('bet.placing') : t('bet.confirm')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlaceBetModal;
