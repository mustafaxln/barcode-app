import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Tara' },
  { to: '/gecmis', label: 'Geçmiş' },
  { to: '/favoriler', label: 'Favoriler' },
  { to: '/profil', label: 'Profil' },
];

export function NavBar() {
  return (
    <nav className="sticky bottom-0 flex justify-around border-t border-neutral-200 bg-white py-2 sm:static sm:justify-center sm:gap-8 sm:border-b sm:border-t-0">
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
    </nav>
  );
}
