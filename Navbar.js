// frontend/src/components/Navbar.js

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Menu, X, LogOut } from 'lucide-react';

const linksForRole = (role) => {
  switch (role) {
    case 'CONSUMER':
      return [
        { to: '/consumer/dashboard', label: 'Dashboard' },
        { to: '/consumer/products', label: 'Shop Deals' },
        { to: '/consumer/profile', label: 'Profile' },
      ];
    case 'MERCHANT':
      return [
        { to: '/merchant/dashboard', label: 'Dashboard' },
        { to: '/merchant/products', label: 'Products' },
        { to: '/merchant/analytics', label: 'Analytics' },
      ];
    case 'FI':
      return [
        { to: '/fi/dashboard', label: 'Dashboard' },
        { to: '/fi/referrals', label: 'Referrals' },
      ];
    default:
      return [];
  }
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = linksForRole(user?.role);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="bg-blue-600 p-2 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Creddual</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Hi, <span className="font-medium text-gray-900">{user?.firstName}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              {l.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 py-2 text-sm text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700">
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg text-center font-medium"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
