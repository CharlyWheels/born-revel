import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';

const CreateAccount = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('create.errorMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('create.errorShort'));
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating account:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError(t('create.errorExists'));
      } else {
        setError(t('create.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error during Google sign-up:', error);
      setError(t('create.errorGoogle'));
    }
  };

  return (
    <Layout gradient="from-yellow-400 via-red-500 to-pink-500">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2">{t('create.title')}</h1>
          <p className="text-white/70 text-center mb-8">{t('create.subtitle')}</p>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-white/90 mb-2 text-sm font-medium">{t('create.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="block text-white/90 mb-2 text-sm font-medium">{t('create.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-white/90 mb-2 text-sm font-medium">{t('create.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-100 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-red-500 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {loading ? t('create.creating') : t('create.createAccount')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">{t('common.or')}</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 bg-white py-3 rounded-xl hover:bg-white/90 transition-all"
          >
            <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
            <span className="text-gray-700 font-medium">{t('create.signUpGoogle')}</span>
          </button>

          <p className="text-center text-white/60 text-sm mt-6">
            {t('create.hasAccount')}{' '}
            <Link href="/login" className="text-white underline hover:no-underline">
              {t('create.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CreateAccount;
