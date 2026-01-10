import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Sun,
  Moon,
  Inbox,
  Building2,
  Search,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from '../Logo';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/search', label: 'Search', icon: Search },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/inbox', label: 'Inbox', icon: Inbox },
    { path: '/businesses', label: 'Businesses', icon: Building2 },
    { path: '/campaigns', label: 'Campaigns', icon: Mail },
    { path: '/performance', label: 'Performance', icon: BarChart3 },
  ];

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    setAccountMenuOpen(false);
    logout();
  };

  const handleAccountClick = () => {
    setAccountMenuOpen(false);
    // Navigate to account settings or show modal
    // For now, we'll just close the menu
  };

  return (
    <div className={`dashboard ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Link to="/search" className="sidebar-logo-link">
            <Logo size={sidebarCollapsed ? 'sm' : 'md'} />
            {!sidebarCollapsed && <span className="sidebar-brand">Ceevaa</span>}
          </Link>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="account-menu-container" ref={accountMenuRef}>
            {!sidebarCollapsed ? (
              <button 
                className="user-info-btn"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.first_name} {user?.last_name}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
              </button>
            ) : (
              <button 
                className="user-avatar-btn"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                title={`${user?.first_name} ${user?.last_name}`}
                aria-expanded={accountMenuOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
              </button>
            )}

            {/* Account Dropdown Menu */}
            {accountMenuOpen && (
              <div className={`account-dropdown ${sidebarCollapsed ? 'collapsed-position' : ''}`}>
                <div className="account-dropdown-header">
                  <div className="dropdown-user-avatar">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-user-name">{user?.first_name} {user?.last_name}</span>
                    <span className="dropdown-user-email">{user?.email}</span>
                  </div>
                </div>
                <div className="account-dropdown-divider" />
                <Link 
                  to="/account" 
                  className="account-dropdown-item"
                  onClick={handleAccountClick}
                >
                  <User size={16} />
                  <span>Account Details</span>
                </Link>
                <Link 
                  to="/settings" 
                  className="account-dropdown-item"
                  onClick={handleAccountClick}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <button 
                  className="account-dropdown-item"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>
                <div className="account-dropdown-divider" />
                <button 
                  className="account-dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <button 
          className="sidebar-collapse-btn"
          onClick={toggleSidebarCollapse}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Mobile menu toggle - only visible on mobile */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>

        <div className="dashboard-content">
          {children || <Outlet />}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
