import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Layout from '../components/Layout';
import Link from 'next/link';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleGoogleLogin = async () => {
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
      console.error('Error during Google sign-in:', error);
      setError(t('login.errorGoogle'));
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error during email sign-in:', error);
      setError(t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout gradient="from-green-400 via-blue-500 to-purple-500">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-white px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8">{t('login.welcomeBack')}</h1>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-white/90 mb-2 text-sm font-medium">{t('login.email')}</label>
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
              <label className="block text-white/90 mb-2 text-sm font-medium">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
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
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white py-3 rounded-xl hover:bg-white/90 transition-all"
          >
            <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
            <span className="text-gray-700 font-medium">{t('login.signInGoogle')}</span>
          </button>

          <p className="text-center text-white/60 text-sm mt-6">
            {t('login.noAccount')}{' '}
            <Link href="/create" className="text-white underline hover:no-underline">
              {t('login.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
