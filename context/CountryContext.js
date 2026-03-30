import { createContext, useContext, useState, useEffect } from 'react';

const CountryContext = createContext();

const COUNTRIES = [
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
];

export const CountryProvider = ({ children }) => {
  const [country, setCountry] = useState('ES');

  useEffect(() => {
    const saved = localStorage.getItem('revel_country');
    if (saved) setCountry(saved);
  }, []);

  const changeCountry = (code) => {
    setCountry(code);
    localStorage.setItem('revel_country', code);
  };

  return (
    <CountryContext.Provider value={{ country, changeCountry, countries: COUNTRIES }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => useContext(CountryContext);
export { COUNTRIES };
