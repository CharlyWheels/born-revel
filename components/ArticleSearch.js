import { useState, useEffect, useRef } from 'react';
import { useCountry } from '../context/CountryContext';
import { useLanguage } from '../context/LanguageContext';

const ArticleSearch = ({ onSelect, onCreateNew }) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { country } = useCountry();
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/articles/suggestions?query=${encodeURIComponent(query)}&country=${country}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        setSuggestions(data || []);
        setIsOpen(true);
      } catch (error) {
        if (error.name === 'AbortError') return; // superseded by a newer query
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      // Cancel a stale request/timer so an older response can't overwrite a newer one.
      controller.abort();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, country]);

  const handleSelect = (item) => {
    if (item.isCreateNew) {
      onCreateNew(query);
      setQuery('');
      setIsOpen(false);
    } else {
      onSelect(item);
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={t('articleSearch.placeholder')}
        className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/70 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((item, index) => (
              <button
                key={item.id || index}
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-200 last:border-b-0 ${
                  item.isCreateNew ? 'bg-gray-50 font-semibold' : ''
                }`}
              >
                {item.isCreateNew ? (
                  <div className="text-gray-800 font-medium">{item.name}</div>
                ) : (
                  <div>
                    <div className="text-gray-800 font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-gray-500 text-sm mt-1 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                    <div className="text-gray-400 text-xs mt-1">
                      {item.providers?.length || 0} {item.providers?.length !== 1 ? t('articleSearch.providers') : t('articleSearch.provider')}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {loading && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ArticleSearch;
