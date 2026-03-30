import { useCountry } from '../context/CountryContext';
import { useState, useRef, useEffect } from 'react';

const CountrySelector = () => {
  const { country, changeCountry, countries } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = countries.find((c) => c.code === country) || countries[0];

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-white/80 hover:text-white transition text-sm"
      >
        <span className="text-lg">{current.flag}</span>
        <span>{current.name}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white rounded-xl shadow-xl py-2 text-gray-800 max-h-60 overflow-y-auto z-50">
          {countries.map((c) => (
            <button
              key={c.code}
              onClick={() => { changeCountry(c.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition flex items-center gap-2 ${
                c.code === country ? 'bg-purple-50 text-purple-600 font-medium' : ''
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
