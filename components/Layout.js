import Navbar from './Navbar';
import CountrySelector from './CountrySelector';
import LanguageSelector from './LanguageSelector';

const Layout = ({ children, gradient = 'from-purple-400 via-pink-500 to-red-500' }) => {
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${gradient}`}>
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="bg-black/10 backdrop-blur-md border-t border-white/10 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/60 text-sm">
            Revel.Baby &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <CountrySelector />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
