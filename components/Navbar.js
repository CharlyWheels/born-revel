import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useState } from 'react';

const Navbar = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white drop-shadow-md">
            Revel.Baby
          </span>
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold">
                {user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="hidden sm:block text-sm truncate max-w-[120px]">
                {user.displayName || user.email}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 text-gray-800 z-50">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 hover:bg-gray-100 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.dashboard')}
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition text-red-500"
                >
                  {t('nav.signout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-white/90 hover:text-white transition text-sm"
            >
              {t('nav.login')}
            </Link>
            <Link
              href="/create"
              className="bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-white/90 transition"
            >
              {t('nav.signup')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
