import { NavLink } from 'react-router-dom';
import { useLanguage } from '../lib/i18n/LanguageContext';
import type { Language } from '../lib/i18n/translations';

const LANGUAGE_OPTIONS: { id: Language; label: string }[] = [
  { id: 'tr', label: 'TR' },
  { id: 'en', label: 'EN' },
];

export function NavBar() {
  const { t, language, setLanguage } = useLanguage();

  const links = [
    { to: '/', label: t('nav.scan') },
    { to: '/gecmis', label: t('nav.history') },
    { to: '/favoriler', label: t('nav.favorites') },
    { to: '/profil', label: t('nav.profile') },
  ];

  return (
    <nav className="sticky bottom-0 flex items-center justify-around gap-1 border-t border-neutral-200 bg-white py-2 sm:static sm:justify-center sm:gap-8 sm:border-b sm:border-t-0">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-100 text-brand-700' : 'text-neutral-500 hover:text-brand-600'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
      <div className="flex items-center gap-0.5 rounded-full border border-neutral-200 p-0.5">
        {LANGUAGE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={language === option.id}
            onClick={() => setLanguage(option.id)}
            className={`rounded-full px-2 py-1 text-xs font-semibold transition-colors ${
              language === option.id
                ? 'bg-brand-600 text-white'
                : 'text-neutral-400 hover:text-brand-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
