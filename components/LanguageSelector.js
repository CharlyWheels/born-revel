import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-full text-sm transition-all ${
          language === 'en'
            ? 'bg-white/30 text-white font-medium'
            : 'text-white/60 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1 rounded-full text-sm transition-all ${
          language === 'es'
            ? 'bg-white/30 text-white font-medium'
            : 'text-white/60 hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSelector;
