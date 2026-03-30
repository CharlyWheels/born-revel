import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ReserveModal = ({ giftItem, paymentConfig, onClose, onReserve }) => {
  const { t, language } = useLanguage();
  const [reservationType, setReservationType] = useState(null);
  const [reservedByName, setReservedByName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const article = giftItem?.article;
  const imageUrl = article?.imageUrls?.[0] || '/placeholder-gift.png';

  const paymentMethods = paymentConfig?.methods || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reservationType || !reservedByName.trim()) return;

    setIsSubmitting(true);
    try {
      await onReserve({
        reservedByName: reservedByName.trim(),
        reservationType,
      });
      onClose();
    } catch (error) {
      console.error('Error reserving gift:', error);
      alert(t('reserve.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100">
        <div className="p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Product Image */}
          <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden mb-4 bg-white/5">
            <img
              src={imageUrl}
              alt={article?.name || 'Gift'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ffffff20" width="200" height="200"/%3E%3Ctext fill="%23ffffff60" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E🎁%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Product Name */}
          <h2 className="text-white text-xl font-bold text-center mb-6">
            {article?.name || 'Gift Item'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Reservation Type Buttons */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setReservationType('buy')}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  reservationType === 'buy'
                    ? 'bg-blue-500/30 border-blue-400 text-white'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">{t('reserve.illBuy')}</div>
                <div className="text-sm opacity-80">{t('reserve.buyDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => setReservationType('donate')}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  reservationType === 'donate'
                    ? 'bg-green-500/30 border-green-400 text-white'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">{t('reserve.illDonate')}</div>
                <div className="text-sm opacity-80">{t('reserve.donateDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => setReservationType('pay')}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  reservationType === 'pay'
                    ? 'bg-amber-500/30 border-amber-400 text-white'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">{t('reserve.illPay')}</div>
                <div className="text-sm opacity-80">{t('reserve.payDesc')}</div>
              </button>
            </div>

            {/* Payment Methods (shown when Pay is selected) */}
            {reservationType === 'pay' && paymentMethods && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-white font-semibold mb-3">{t('reserve.paymentMethods')}</div>
                <div className="space-y-2 text-sm text-white/80">
                  {paymentMethods.bizum?.enabled && (
                    <div>
                      <span className="font-medium">{t('settings.bizum')}:</span>{' '}
                      {paymentMethods.bizum.phone || t('reserve.notConfigured')}
                    </div>
                  )}
                  {paymentMethods.bankAccount?.enabled && (
                    <div>
                      <span className="font-medium">{t('settings.bankAccount')} (IBAN):</span>{' '}
                      {paymentMethods.bankAccount.iban || t('reserve.notConfigured')}
                    </div>
                  )}
                  {paymentMethods.paypal?.enabled && (
                    <div>
                      <span className="font-medium">{t('settings.paypal')}:</span>{' '}
                      {paymentMethods.paypal.email || t('reserve.notConfigured')}
                    </div>
                  )}
                  {paymentMethods.cash?.enabled && (
                    <div>
                      <span className="font-medium">{t('settings.cash')}:</span> {t('reserve.accepted')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">
                {t('reserve.yourName')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reservedByName}
                onChange={(e) => setReservedByName(e.target.value)}
                required
                placeholder={t('reserve.enterName')}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!reservationType || !reservedByName.trim() || isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('reserve.reserving') : t('reserve.confirm')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReserveModal;
