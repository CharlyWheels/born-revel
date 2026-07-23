import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import { useCountry, COUNTRIES } from '../../../context/CountryContext';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../../lib/apiClient';
import { getPublicBabyUrl, getPublicBabyDisplay } from '../../../lib/urls';

const BabySettings = () => {
  const { user, loading: authLoading } = useAuth();
  const { country: userCountry } = useCountry();
  const { t, language } = useLanguage();
  const router = useRouter();
  const { babyId } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    coOwners: true,
    giftRegistry: true,
    pregnancyTracker: true,
    birthBetting: true,
  });

  const [baby, setBaby] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dueDate: '',
    customSlug: '',
    country: 'ES',
    giftRegistryEnabled: false,
    pregnancyTrackerEnabled: false,
    birthBettingEnabled: false,
    giftRegistrySettings: {},
    giftRegistryPaymentMethods: {
      bizum: { enabled: false, phone: '' },
      bankAccount: { enabled: false, iban: '' },
      paypal: { enabled: false, email: '' },
      cash: { enabled: false },
    },
    pregnancyTrackerPublic: false,
    pregnancyStartDate: '',
    pregnancyTrackerSettings: {},
    bettingSettings: {
      allowSameDayBets: false,
      allowDateRanges: false,
      allowMultipleBets: false,
      betAmount: '',
    },
    bettingPaymentMethods: {
      bizum: { enabled: false, phone: '' },
      bankAccount: { enabled: false, iban: '' },
      paypal: { enabled: false, email: '' },
      cash: { enabled: false },
    },
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    const url = getPublicBabyUrl(formData.customSlug);
    if (navigator.share) {
      try {
        await navigator.share({ title: formData.name, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch baby data
  useEffect(() => {
    if (babyId && user) {
      fetchBaby();
    }
  }, [babyId, user]);

  const fetchBaby = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/babies/${babyId}`);
      if (res.ok) {
        const data = await res.json();
        setBaby(data);

        // Extract payment configs
        const giftRegistryPayment = data.paymentConfigs?.find((pc) => pc.featureType === 'gift');
        const bettingPayment = data.paymentConfigs?.find((pc) => pc.featureType === 'betting');

        setFormData({
          name: data.name || '',
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
          customSlug: data.customSlug || '',
          country: data.country || userCountry || 'ES',
          giftRegistryEnabled: data.giftRegistryEnabled || false,
          pregnancyTrackerEnabled: data.pregnancyTrackerEnabled || false,
          birthBettingEnabled: data.birthBettingEnabled || false,
          giftRegistrySettings: data.giftRegistrySettings || {},
          pregnancyTrackerPublic: data.pregnancyTrackerPublic || false,
          pregnancyStartDate: data.pregnancyStartDate ? new Date(data.pregnancyStartDate).toISOString().split('T')[0] : '',
          pregnancyTrackerSettings: data.pregnancyTrackerSettings || {},
          bettingSettings: data.bettingSettings || {
            allowSameDayBets: false,
            allowDateRanges: false,
            allowMultipleBets: false,
            betAmount: '',
          },
          giftRegistryPaymentMethods: giftRegistryPayment?.methods || {
            bizum: { enabled: false, phone: '' },
            bankAccount: { enabled: false, iban: '' },
            paypal: { enabled: false, email: '' },
            cash: { enabled: false },
          },
          bettingPaymentMethods: bettingPayment?.methods || {
            bizum: { enabled: false, phone: '' },
            bankAccount: { enabled: false, iban: '' },
            paypal: { enabled: false, email: '' },
            cash: { enabled: false },
          },
        });
      } else {
        showToast(t('settings.loadFailed'), 'error');
      }
    } catch (err) {
      console.error('Error fetching baby:', err);
      showToast(t('settings.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const toggleSection = (section) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const res = await apiFetch(`/api/babies/${babyId}/invite`, {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          inviterName: user.displayName || user.email,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(t('settings.inviteSent'), 'success');
        setInviteEmail('');
        if (data.inviteLink) {
          setLastInviteLink(data.inviteLink);
          setLinkCopied(false);
        }
        fetchBaby(); // Refresh to show new invitation
      } else {
        showToast(data.error || t('settings.inviteFailed'), 'error');
      }
    } catch (err) {
      showToast(t('settings.inviteError'), 'error');
      console.error('Error inviting:', err);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(lastInviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleRemoveOwner = async (ownerId) => {
    if (!confirm(t('settings.removeConfirm'))) return;

    try {
      const res = await apiFetch(`/api/babies/${babyId}/remove-owner`, {
        method: 'DELETE',
        body: JSON.stringify({ ownerIdToRemove: ownerId }),
      });

      if (res.ok) {
        fetchBaby();
      } else {
        const data = await res.json();
        showToast(data.error || t('settings.removeFailed'), 'error');
      }
    } catch (err) {
      showToast(t('settings.removeFailed'), 'error');
      console.error('Error removing owner:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const paymentConfigs = [];

      // Gift registry payment config
      if (formData.giftRegistryEnabled) {
        paymentConfigs.push({
          featureType: 'gift',
          methods: formData.giftRegistryPaymentMethods,
        });
      }

      // Betting payment config
      if (formData.birthBettingEnabled) {
        paymentConfigs.push({
          featureType: 'betting',
          methods: formData.bettingPaymentMethods,
        });
      }

      const res = await apiFetch(`/api/babies/${babyId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          dueDate: formData.dueDate,
          customSlug: formData.customSlug,
          country: formData.country,
          giftRegistryEnabled: formData.giftRegistryEnabled,
          pregnancyTrackerEnabled: formData.pregnancyTrackerEnabled,
          birthBettingEnabled: formData.birthBettingEnabled,
          giftRegistrySettings: formData.giftRegistrySettings,
          pregnancyTrackerPublic: formData.pregnancyTrackerPublic,
          pregnancyTrackerSettings: formData.pregnancyTrackerSettings,
          pregnancyStartDate: formData.pregnancyStartDate || null,
          bettingSettings: formData.bettingSettings,
          paymentConfigs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(t('settings.savedSuccess'), 'success');
        setBaby(data);
      } else {
        showToast(data.error || t('settings.saveFailed'), 'error');
      }
    } catch (err) {
      showToast(t('settings.saveError'), 'error');
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentMethod = (feature, method, field, value) => {
    const key = feature === 'gift' ? 'giftRegistryPaymentMethods' : 'bettingPaymentMethods';
    setFormData({
      ...formData,
      [key]: {
        ...formData[key],
        [method]: {
          ...formData[key][method],
          [field]: value,
        },
      },
    });
  };

  if (authLoading || loading) {
    return (
      <Layout gradient="from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex items-center justify-center min-h-[80vh] text-white">
          <div className="text-xl">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  if (!user || !baby) {
    return null;
  }

  return (
    <Layout gradient="from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">{t('settings.title')}</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/80 hover:text-white transition-all"
          >
            {'← ' + t('settings.backDashboard')}
          </button>
        </div>

        {/* Quick Access to Feature Pages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {formData.giftRegistryEnabled && (
            <Link
              href={`/baby/${babyId}/gifts`}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/20 transition-all"
            >
              <span className="text-2xl">🎁</span>
              <p className="text-white font-medium mt-1">{t('settings.manageGifts')}</p>
            </Link>
          )}
          {formData.pregnancyTrackerEnabled && (
            <Link
              href={`/baby/${babyId}/pregnancy`}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/20 transition-all"
            >
              <span className="text-2xl">🤰</span>
              <p className="text-white font-medium mt-1">{t('settings.pregnancyTracker')}</p>
            </Link>
          )}
          {formData.birthBettingEnabled && (
            <Link
              href={`/baby/${babyId}/bets`}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/20 transition-all"
            >
              <span className="text-2xl">🎰</span>
              <p className="text-white font-medium mt-1">{t('settings.manageBets')}</p>
            </Link>
          )}
        </div>

        {/* Public URL Info */}
        {formData.customSlug && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">{t('settings.publicUrl')}</p>
              <p className="text-white font-medium">{typeof window !== 'undefined' ? window.location.origin : ''}/b/{formData.customSlug}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                {shareCopied ? t('dashboard.linkCopied') : t('dashboard.share')}
              </button>
              <Link
                href={`/b/${formData.customSlug}`}
                target="_blank"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                {t('common.preview')}
              </Link>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg backdrop-blur-md border ${
              toast.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-100'
                : 'bg-red-500/20 border-red-500/50 text-red-100'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Basic Info Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-2xl font-bold text-white">{t('settings.basicInfo')}</h2>
            <span className="text-white/70">{expandedSections.basic ? '−' : '+'}</span>
          </button>

          {expandedSections.basic && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('settings.babyName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('settings.dueDate')}</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('settings.customUrl')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-sm">{getPublicBabyDisplay('')}</span>
                  <input
                    type="text"
                    value={formData.customSlug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <p className="text-white/60 text-sm mt-1">{t('settings.previewSlug', { slug: formData.customSlug || 'your-slug' })}</p>
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('settings.country')}</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-gray-800">
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Co-Owners Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
          <button
            onClick={() => toggleSection('coOwners')}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-2xl font-bold text-white">{t('settings.coOwners')}</h2>
            <span className="text-white/70">{expandedSections.coOwners ? '−' : '+'}</span>
          </button>

          {expandedSections.coOwners && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">{t('settings.currentOwners')}</h3>
                <div className="space-y-2">
                  {baby.owners?.map((owner) => (
                    <div
                      key={owner.id}
                      className="bg-white/10 rounded-lg p-3 flex items-center justify-between"
                    >
                      <span className="text-white">
                        {owner.user.name || owner.user.email} {owner.role === 'primary' && t('settings.primary')}
                      </span>
                      {owner.role !== 'primary' && baby.owners?.some(o => o.userId === user.uid && o.role === 'primary') && (
                        <button
                          onClick={() => handleRemoveOwner(owner.id)}
                          className="text-red-300 hover:text-red-100 text-sm transition"
                        >
                          {t('settings.removeOwner')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('settings.enterEmail')}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="bg-white text-purple-600 py-2 px-6 rounded-lg font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {inviting ? t('settings.sending') : t('settings.invite')}
                </button>
              </form>

              {lastInviteLink && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white/80 text-sm truncate mr-3">{lastInviteLink}</span>
                  <button
                    onClick={handleCopyLink}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-1 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                  >
                    {linkCopied ? t('settings.linkCopied') : t('settings.copyLink')}
                  </button>
                </div>
              )}

              {baby.invitations && baby.invitations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white/70 mb-2">{t('settings.pendingInvitations')}</h4>
                  {baby.invitations.map((inv) => (
                    <div key={inv.id} className="text-white/60 text-sm">
                      {inv.email} {t('settings.pending')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gift Registry Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('giftRegistry')}
              className="flex-1 flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-white">{t('settings.giftRegistry')}</h2>
              <span className="text-white/70">{expandedSections.giftRegistry ? '−' : '+'}</span>
            </button>
            <label className="flex items-center gap-2 ml-4">
              <input
                type="checkbox"
                checked={formData.giftRegistryEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, giftRegistryEnabled: e.target.checked })
                }
                className="w-5 h-5 rounded"
              />
              <span className="text-white font-medium">{t('common.enable')}</span>
            </label>
          </div>

          {expandedSections.giftRegistry && formData.giftRegistryEnabled && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">{t('settings.paymentMethods')}</h3>

              {/* Bizum */}
              <div className="bg-white/5 rounded-lg p-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.giftRegistryPaymentMethods.bizum.enabled}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'bizum', 'enabled', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white font-medium">{t('settings.bizum')}</span>
                </label>
                {formData.giftRegistryPaymentMethods.bizum.enabled && (
                  <input
                    type="tel"
                    value={formData.giftRegistryPaymentMethods.bizum.phone || ''}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'bizum', 'phone', e.target.value)
                    }
                    placeholder={t('settings.phoneNumber')}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                )}
              </div>

              {/* Bank Account */}
              <div className="bg-white/5 rounded-lg p-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.giftRegistryPaymentMethods.bankAccount.enabled}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'bankAccount', 'enabled', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white font-medium">{t('settings.bankAccount')}</span>
                </label>
                {formData.giftRegistryPaymentMethods.bankAccount.enabled && (
                  <input
                    type="text"
                    value={formData.giftRegistryPaymentMethods.bankAccount.iban || ''}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'bankAccount', 'iban', e.target.value)
                    }
                    placeholder={t('settings.iban')}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                )}
              </div>

              {/* PayPal */}
              <div className="bg-white/5 rounded-lg p-4">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.giftRegistryPaymentMethods.paypal.enabled}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'paypal', 'enabled', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white font-medium">{t('settings.paypal')}</span>
                </label>
                {formData.giftRegistryPaymentMethods.paypal.enabled && (
                  <input
                    type="email"
                    value={formData.giftRegistryPaymentMethods.paypal.email || ''}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'paypal', 'email', e.target.value)
                    }
                    placeholder={t('settings.paypalEmail')}
                    className="w-full mt-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                )}
              </div>

              {/* Cash */}
              <div className="bg-white/5 rounded-lg p-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.giftRegistryPaymentMethods.cash.enabled}
                    onChange={(e) =>
                      updatePaymentMethod('gift', 'cash', 'enabled', e.target.checked)
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white font-medium">{t('settings.cash')}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Pregnancy Tracker Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('pregnancyTracker')}
              className="flex-1 flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-white">{t('settings.pregnancyTracker')}</h2>
              <span className="text-white/70">{expandedSections.pregnancyTracker ? '−' : '+'}</span>
            </button>
            <label className="flex items-center gap-2 ml-4">
              <input
                type="checkbox"
                checked={formData.pregnancyTrackerEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, pregnancyTrackerEnabled: e.target.checked })
                }
                className="w-5 h-5 rounded"
              />
              <span className="text-white font-medium">{t('common.enable')}</span>
            </label>
          </div>

          {expandedSections.pregnancyTracker && formData.pregnancyTrackerEnabled && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('settings.pregnancyStartDate')}</label>
                <input
                  type="date"
                  value={formData.pregnancyStartDate}
                  onChange={(e) =>
                    setFormData({ ...formData, pregnancyStartDate: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.pregnancyTrackerPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, pregnancyTrackerPublic: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-white">{t('settings.makePublic')}</span>
              </label>
            </div>
          )}
        </div>

        {/* Birth Date Betting Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => toggleSection('birthBetting')}
              className="flex-1 flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-white">{t('settings.birthBetting')}</h2>
              <span className="text-white/70">{expandedSections.birthBetting ? '−' : '+'}</span>
            </button>
            <label className="flex items-center gap-2 ml-4">
              <input
                type="checkbox"
                checked={formData.birthBettingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, birthBettingEnabled: e.target.checked })
                }
                className="w-5 h-5 rounded"
              />
              <span className="text-white font-medium">{t('common.enable')}</span>
            </label>
          </div>

          {expandedSections.birthBetting && formData.birthBettingEnabled && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.bettingSettings.allowSameDayBets}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bettingSettings: {
                          ...formData.bettingSettings,
                          allowSameDayBets: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white">{t('settings.allowSameDay')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.bettingSettings.allowDateRanges}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bettingSettings: {
                          ...formData.bettingSettings,
                          allowDateRanges: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white">{t('settings.allowDateRanges')}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.bettingSettings.allowMultipleBets}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bettingSettings: {
                          ...formData.bettingSettings,
                          allowMultipleBets: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white">{t('settings.allowMultiple')}</span>
                </label>
              </div>

              <div>
                <label className="block text-white/90 mb-2 font-medium">{t('settings.betAmount')}</label>
                <input
                  type="number"
                  value={formData.bettingSettings.betAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bettingSettings: {
                        ...formData.bettingSettings,
                        betAmount: e.target.value,
                      },
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-3">{t('settings.paymentMethods')}</h3>

                {/* Bizum */}
                <div className="bg-white/5 rounded-lg p-4 mb-2">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.bettingPaymentMethods.bizum.enabled}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'bizum', 'enabled', e.target.checked)
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-white font-medium">{t('settings.bizum')}</span>
                  </label>
                  {formData.bettingPaymentMethods.bizum.enabled && (
                    <input
                      type="tel"
                      value={formData.bettingPaymentMethods.bizum.phone || ''}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'bizum', 'phone', e.target.value)
                      }
                      placeholder={t('settings.phoneNumber')}
                      className="w-full mt-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  )}
                </div>

                {/* Bank Account */}
                <div className="bg-white/5 rounded-lg p-4 mb-2">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.bettingPaymentMethods.bankAccount.enabled}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'bankAccount', 'enabled', e.target.checked)
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-white font-medium">{t('settings.bankAccount')}</span>
                  </label>
                  {formData.bettingPaymentMethods.bankAccount.enabled && (
                    <input
                      type="text"
                      value={formData.bettingPaymentMethods.bankAccount.iban || ''}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'bankAccount', 'iban', e.target.value)
                      }
                      placeholder={t('settings.iban')}
                      className="w-full mt-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  )}
                </div>

                {/* PayPal */}
                <div className="bg-white/5 rounded-lg p-4 mb-2">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.bettingPaymentMethods.paypal.enabled}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'paypal', 'enabled', e.target.checked)
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-white font-medium">{t('settings.paypal')}</span>
                  </label>
                  {formData.bettingPaymentMethods.paypal.enabled && (
                    <input
                      type="email"
                      value={formData.bettingPaymentMethods.paypal.email || ''}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'paypal', 'email', e.target.value)
                      }
                      placeholder={t('settings.paypalEmail')}
                      className="w-full mt-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  )}
                </div>

                {/* Cash */}
                <div className="bg-white/5 rounded-lg p-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.bettingPaymentMethods.cash.enabled}
                      onChange={(e) =>
                        updatePaymentMethod('betting', 'cash', 'enabled', e.target.checked)
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-white font-medium">{t('settings.cash')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-purple-600 py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg disabled:opacity-50"
          >
            {saving ? t('settings.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BabySettings;
