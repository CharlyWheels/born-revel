import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import GiftCard from '../../../components/GiftCard';
import ReserveModal from '../../../components/ReserveModal';
import { useLanguage } from '../../../context/LanguageContext';

const PublicGiftRegistry = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { customSlug } = router.query;
  const [babyData, setBabyData] = useState(null);
  const [giftItems, setGiftItems] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGift, setSelectedGift] = useState(null);
  const [showReserveModal, setShowReserveModal] = useState(false);

  useEffect(() => {
    if (customSlug) {
      fetchPublicData();
    }
  }, [customSlug]);

  const fetchPublicData = async () => {
    try {
      const response = await fetch(`/api/public/${customSlug}`);
      if (response.ok) {
        const data = await response.json();
        setBabyData(data);
        if (data.giftRegistry?.enabled) {
          setGiftItems(data.giftRegistry.items || []);
          setPaymentConfig(data.giftRegistry.paymentConfig);
        }
      } else if (response.status === 404) {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (giftItem) => {
    setSelectedGift(giftItem);
    setShowReserveModal(true);
  };

  const handleReserveSubmit = async (reservationData) => {
    try {
      const response = await fetch(
        `/api/babies/${babyData.id}/gifts/${selectedGift.id}/reserve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reservationData),
        }
      );

      if (response.ok) {
        const updatedGift = await response.json();
        setGiftItems(
          giftItems.map((item) =>
            item.id === updatedGift.id ? updatedGift : item
          )
        );
        setShowReserveModal(false);
        setSelectedGift(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reserve gift');
      }
    } catch (error) {
      console.error('Error reserving gift:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Layout gradient="from-pink-500 via-rose-500 to-orange-500">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!babyData || !babyData.giftRegistry?.enabled) {
    return (
      <Layout gradient="from-pink-500 via-rose-500 to-orange-500">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">{t('publicGifts.notAvailable')}</div>
        </div>
      </Layout>
    );
  }

  const availableItems = giftItems.filter((item) => item.status === 'available');
  const reservedItems = giftItems.filter((item) => item.status !== 'available');

  return (
    <Layout gradient="from-pink-500 via-rose-500 to-orange-500">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Baby Name */}
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          {t('publicGifts.registryTitle', { name: babyData.name })}
        </h1>
        {babyData.owners && babyData.owners.length > 0 && (
          <p className="text-white/80 text-center mb-8">
            {t('publicGifts.for', { owners: babyData.owners.map((o) => o.name).join(' & ') })}
          </p>
        )}

        {/* Available Items */}
        {availableItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('publicGifts.available', { count: availableItems.length })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableItems.map((item) => (
                <GiftCard
                  key={item.id}
                  giftItem={item}
                  isOwner={false}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reserved Items */}
        {reservedItems.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('publicGifts.reserved', { count: reservedItems.length })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reservedItems.map((item) => (
                <GiftCard
                  key={item.id}
                  giftItem={item}
                  isOwner={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {giftItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">
              {t('publicGifts.noGifts')}
            </p>
          </div>
        )}
      </div>

      {/* Reserve Modal */}
      {showReserveModal && selectedGift && (
        <ReserveModal
          giftItem={selectedGift}
          paymentConfig={paymentConfig}
          onClose={() => {
            setShowReserveModal(false);
            setSelectedGift(null);
          }}
          onReserve={handleReserveSubmit}
        />
      )}
    </Layout>
  );
};

export default PublicGiftRegistry;
