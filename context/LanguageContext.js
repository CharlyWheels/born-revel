import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('revel_language');
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguageState(saved);
    } else if (navigator.language?.startsWith('es')) {
      setLanguageState('es');
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('revel_language', lang);
  };

  const t = useCallback((key, params = {}) => {
    let text = translations[language]?.[key] || translations['en']?.[key] || key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
