import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('rka_language') || 'en';
  });

  const setLanguage = (lang) => {
    if (['en', 'fil', 'taglish'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('rka_language', lang);
    }
  };

  const t = (key, paramsOrFallback = '', fallback = '') => {
    let str = '';
    const dict = translations[language] || translations.en;
    if (dict && dict[key] !== undefined) {
      str = dict[key];
    } else if (translations.en && translations.en[key] !== undefined) {
      str = translations.en[key];
    } else {
      str = typeof paramsOrFallback === 'string' && paramsOrFallback ? paramsOrFallback : (typeof fallback === 'string' ? fallback : '') || key;
    }
    if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
      Object.entries(paramsOrFallback).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key, fallback = '') => fallback || key
    };
  }
  return context;
}

export const useTranslation = useLanguage;
