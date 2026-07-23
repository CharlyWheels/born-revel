import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../../firebase';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/apiClient';

const AcceptInvitation = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { token } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | needsAuth | accepting | success | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    if (authLoading) {
      setStatus('loading');
      return;
    }

    if (!user) {
      setStatus('needsAuth');
    } else {
      acceptInvitation();
    }
  }, [token, user, authLoading]);

  const acceptInvitation = async () => {
    setStatus('accepting');
    try {
      const res = await apiFetch('/api/babies/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        // Redirect to dashboard after 3 seconds
        setTimeout(() => router.push('/dashboard'), 3000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || t('invite.failedAccept'));
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setStatus('error');
      setErrorMessage(t('invite.somethingWrong'));
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
      // The useEffect will pick up the auth change and call acceptInvitation
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setErrorMessage(t('invite.signInFailed'));
    }
  };

  return (
    <Layout gradient="from-purple-500 via-pink-500 to-rose-500">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full text-center">
          {status === 'loading' && (
            <>
              <div className="text-4xl mb-4 animate-pulse">✉️</div>
              <h1 className="text-2xl font-bold mb-2">{t('invite.loading')}</h1>
            </>
          )}

          {status === 'needsAuth' && (
            <>
              <div className="text-4xl mb-4">✉️</div>
              <h1 className="text-2xl font-bold mb-2">{t('invite.youveBeenInvited')}</h1>
              <p className="text-white/70 mb-6">
                {t('invite.signInToAccept')}
              </p>
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 bg-white text-gray-800 py-3 px-6 rounded-full mx-auto hover:bg-white/90 transition-all font-medium"
              >
                <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                {t('invite.signInGoogle')}
              </button>
            </>
          )}

          {status === 'accepting' && (
            <>
              <div className="text-4xl mb-4 animate-bounce">🎉</div>
              <h1 className="text-2xl font-bold mb-2">{t('invite.accepting')}</h1>
              <p className="text-white/70">{t('invite.pleaseWait')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-2">{t('invite.accepted')}</h1>
              <p className="text-white/70 mb-4">
                {t('invite.coOwner')}
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white text-purple-600 py-2 px-6 rounded-full font-medium hover:bg-white/90 transition"
              >
                {t('common.goDashboard')}
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-2">{t('invite.oops')}</h1>
              <p className="text-white/70 mb-4">{errorMessage}</p>
              <button
                onClick={() => router.push('/')}
                className="bg-white text-purple-600 py-2 px-6 rounded-full font-medium hover:bg-white/90 transition"
              >
                {t('common.goHome')}
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AcceptInvitation;
