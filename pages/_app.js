import "@/styles/globals.css";
import { AuthProvider } from '../context/AuthContext';
import { CountryProvider } from '../context/CountryContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <CountryProvider>
        <LanguageProvider>
          <Component {...pageProps} />
        </LanguageProvider>
      </CountryProvider>
    </AuthProvider>
  );
}
