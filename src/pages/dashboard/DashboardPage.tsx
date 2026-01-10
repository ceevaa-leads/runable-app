import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Mail, 
  TrendingUp, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Button } from '../../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const stats = [
    { label: 'Total Leads', value: '0', icon: Users, change: '+0%' },
    { label: 'Businesses', value: '0', icon: Building2, change: '+0%' },
    { label: 'Emails Sent', value: '0', icon: Mail, change: '+0%' },
    { label: 'Conversion Rate', value: '0%', icon: TrendingUp, change: '+0%' },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Logo size="md" />
          <span className="sidebar-brand">Ceevaa</span>
          <button 
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/leads" 
            className={`nav-item ${location.pathname === '/leads' ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Leads</span>
          </Link>
          <Link 
            to="/businesses" 
            className={`nav-item ${location.pathname === '/businesses' ? 'active' : ''}`}
          >
            <Building2 size={20} />
            <span>Businesses</span>
          </Link>
          <Link 
            to="/campaigns" 
            className={`nav-item ${location.pathname === '/campaigns' ? 'active' : ''}`}
          >
            <Mail size={20} />
            <span>Campaigns</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.first_name} {user?.last_name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={18} />}
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="header-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.first_name}!</p>
          </div>

          <div className="header-actions">
            <ThemeToggle />
          </div>
        </header>

        <div className="dashboard-content">
          {/* Account Info Card */}
          {user?.account && (
            <div className="account-card">
              <div className="account-info">
                <h2>{user.account.client_name}</h2>
                <span className={`account-status status-${user.account.client_status}`}>
                  {user.account.client_status}
                </span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon">
                  <stat.icon size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
                <span className="stat-change positive">{stat.change}</span>
              </div>
            ))}
          </div>

          {/* Empty State */}
          <div className="empty-state">
            <div className="empty-icon">
              <Users size={48} />
            </div>
            <h3>No leads yet</h3>
            <p>Start by adding businesses to discover potential leads</p>
            <Button variant="primary" size="lg">
              Add Your First Business
            </Button>
          </div>
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

