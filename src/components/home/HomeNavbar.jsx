import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gavel, Sun, Moon, Bell, LogOut, UserPlus } from 'lucide-react';
import { useSessionUser } from '../../hooks/useSessionUser';
import { useTheme } from '../../contexts/ThemeContext';

export default function HomeNavbar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const user = useSessionUser();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
    window.location.reload();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-white/5 relative z-50 bg-white/95 dark:bg-[#0B152A]/95 backdrop-blur-2xl sticky top-0 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#0B152A]">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-gradient-to-br from-auctus-cyan to-auctus-teal rounded-xl flex items-center justify-center shadow-lg shadow-auctus-teal/20 group-hover:rotate-[15deg] group-hover:shadow-auctus-teal/40 transition-all duration-300">
           <Gavel className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">AUCTUS</span>
      </Link>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme} 
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        {user && (
          <>
            <Link 
              to={user.role === 'admin' ? '/admin/dashboard' : user.role === 'seller' ? '/seller/dashboard' : '/dashboard'}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-auctus-teal/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 mr-2"
            >
              Dashboard
            </Link>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Bell className="w-5 h-5" />
              </button>
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/50 animate-pulse">3</span>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl hover:from-slate-200 hover:to-slate-100 dark:hover:from-white/15 dark:hover:to-white/10 transition-all duration-300 cursor-pointer group">
              <div className="w-8 h-8 bg-gradient-to-br from-auctus-cyan to-auctus-teal rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                {getInitials(user.name)}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{user.name}</span>
              <button 
                onClick={handleLogout}
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 ml-1 p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-300"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
        {!user && (
          <Link 
            to="/auth" 
            className="flex items-center gap-2 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-auctus-teal/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <UserPlus className="w-4 h-4" />
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
