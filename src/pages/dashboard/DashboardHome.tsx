import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  UserCheck, 
  UserPlus, 
  Mail, 
  Send, 
  CheckCircle2, 
  MousePointerClick,
  Calendar,
  TrendingUp,
  Clock,
  MessageSquare,
  Zap,
  Reply,
  BarChart3
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { dashboardService } from '../../services/leads.service';

// Types for dashboard stats
interface DashboardStats {
  businesses: number;
  customers: number;
  prospects: number;
  leads: {
    total: number;
    new: number;
    contacted: number;
    in_progress: number;
    dormant: number;
  };
}

interface EmailStats {
  sent: number;
  delivered: number;
  deliveredPercent: number;
  clicked: number;
  clickedPercent: number;
}

interface ResponseRateStats {
  totalContacted: number;
  totalReplied: number;
  responseRate: number;
  emailsSent: number;
  repliesReceived: number;
}

interface TrendDataPoint {
  period_label: string;
  leads_added: number;
  emails_sent: number;
  replies_received: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';
type TrendPeriod = 'weekly' | 'monthly';

export const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    businesses: 0,
    customers: 0,
    prospects: 0,
    leads: { total: 0, new: 0, contacted: 0, in_progress: 0, dormant: 0 }
  });
  const [emailStats, setEmailStats] = useState<EmailStats>({
    sent: 0,
    delivered: 0,
    deliveredPercent: 0,
    clicked: 0,
    clickedPercent: 0
  });
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(true);
  
  // Response Rate state
  const [responseRate, setResponseRate] = useState<ResponseRateStats>({
    totalContacted: 0,
    totalReplied: 0,
    responseRate: 0,
    emailsSent: 0,
    repliesReceived: 0
  });
  const [responseRateLoading, setResponseRateLoading] = useState(true);
  
  // Trends state
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('weekly');
  const [trendsLoading, setTrendsLoading] = useState(true);

  // Fetch dashboard stats from the new API
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await dashboardService.getStats();
        
        setStats({
          businesses: response.businesses.total,
          customers: response.businesses.customers,
          prospects: response.businesses.prospects,
          leads: {
            total: response.leads.total,
            new: response.leads.by_status.new,
            contacted: response.leads.by_status.contacted,
            in_progress: response.leads.by_status.in_progress,
            dormant: response.leads.by_status.dormant
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch email stats based on date range from the new API
  useEffect(() => {
    const fetchEmailStats = async () => {
      setEmailLoading(true);
      try {
        // Calculate date range timestamps
        const now = Date.now();
        let startDate: number | undefined;
        
        switch (dateRange) {
          case '7d':
            startDate = now - (7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = now - (30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = now - (90 * 24 * 60 * 60 * 1000);
            break;
          case 'all':
          default:
            startDate = undefined;
            break;
        }
        
        const response = await dashboardService.getEmailStats({
          start_date: startDate,
          end_date: now,
        });
        
        setEmailStats({
          sent: response.emails_sent,
          delivered: response.emails_delivered,
          deliveredPercent: response.delivery_rate,
          clicked: response.emails_engaged,
          clickedPercent: response.engagement_rate
        });
      } catch (error) {
        console.error('Error fetching email stats:', error);
        // On error, reset to zeros
        setEmailStats({
          sent: 0,
          delivered: 0,
          deliveredPercent: 0,
          clicked: 0,
          clickedPercent: 0
        });
      } finally {
        setEmailLoading(false);
      }
    };

    fetchEmailStats();
  }, [dateRange]);

  // Fetch response rate stats based on date range
  useEffect(() => {
    const fetchResponseRate = async () => {
      setResponseRateLoading(true);
      try {
        const now = Date.now();
        let startDate: number | undefined;
        
        switch (dateRange) {
          case '7d':
            startDate = now - (7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = now - (30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = now - (90 * 24 * 60 * 60 * 1000);
            break;
          case 'all':
          default:
            startDate = undefined;
            break;
        }
        
        const response = await dashboardService.getResponseRate({
          start_date: startDate,
          end_date: now,
        });
        
        setResponseRate({
          totalContacted: response.total_contacted,
          totalReplied: response.total_replied,
          responseRate: response.response_rate,
          emailsSent: response.emails_sent,
          repliesReceived: response.replies_received
        });
      } catch (error) {
        console.error('Error fetching response rate:', error);
        setResponseRate({
          totalContacted: 0,
          totalReplied: 0,
          responseRate: 0,
          emailsSent: 0,
          repliesReceived: 0
        });
      } finally {
        setResponseRateLoading(false);
      }
    };

    fetchResponseRate();
  }, [dateRange]);

  // Fetch trends data
  useEffect(() => {
    const fetchTrends = async () => {
      setTrendsLoading(true);
      try {
        const response = await dashboardService.getTrends({
          period: trendPeriod,
          limit: 8,
        });
        
        setTrends(response.data);
      } catch (error) {
        console.error('Error fetching trends:', error);
        setTrends([]);
      } finally {
        setTrendsLoading(false);
      }
    };

    fetchTrends();
  }, [trendPeriod]);

  const dateRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  // Calculate max value for trend chart scaling
  const maxTrendValue = Math.max(
    ...trends.map(t => Math.max(t.leads_added, t.emails_sent, t.replies_received)),
    1
  );

  return (
    <div className="dashboard-home">
      {/* Section 1: Core Metrics */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <Building2 size={20} />
            Business Overview
          </h2>
        </div>
        
        <div className="metrics-grid core-metrics">
          {/* Businesses Card */}
          <div className="metric-card">
            <div className="metric-icon businesses">
              <Building2 size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-value">{loading ? '—' : stats.businesses}</span>
              <span className="metric-label">Total Businesses</span>
              <span className="metric-description">Customers + Prospects</span>
            </div>
          </div>

          {/* Customers Card */}
          <div className="metric-card">
            <div className="metric-icon customers">
              <UserCheck size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-value">{loading ? '—' : stats.customers}</span>
              <span className="metric-label">Customers</span>
              <span className="metric-description coming-soon">Coming Soon</span>
            </div>
          </div>

          {/* Prospects Card */}
          <div className="metric-card">
            <div className="metric-icon prospects">
              <UserPlus size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-value">{loading ? '—' : stats.prospects}</span>
              <span className="metric-label">Prospects</span>
              <span className="metric-description">Potential customers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Leads Overview */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <Users size={20} />
            Leads Overview
          </h2>
          <Link to="/leads" className="section-link">View All Leads →</Link>
        </div>
        
        <div className="leads-overview-card">
          <div className="leads-total">
            <div className="leads-total-value">{loading ? '—' : stats.leads.total}</div>
            <div className="leads-total-label">Total Leads</div>
          </div>
          
          <div className="leads-breakdown">
            <div className="lead-status-item new">
              <div className="status-icon">
                <Zap size={16} />
              </div>
              <div className="status-info">
                <span className="status-value">{loading ? '—' : stats.leads.new}</span>
                <span className="status-label">New</span>
              </div>
            </div>
            
            <div className="lead-status-item contacted">
              <div className="status-icon">
                <Send size={16} />
              </div>
              <div className="status-info">
                <span className="status-value">{loading ? '—' : stats.leads.contacted}</span>
                <span className="status-label">Contacted</span>
              </div>
            </div>
            
            <div className="lead-status-item in-progress">
              <div className="status-icon">
                <MessageSquare size={16} />
              </div>
              <div className="status-info">
                <span className="status-value">{loading ? '—' : stats.leads.in_progress}</span>
                <span className="status-label">In Progress</span>
              </div>
            </div>
            
            <div className="lead-status-item dormant">
              <div className="status-icon">
                <Clock size={16} />
              </div>
              <div className="status-info">
                <span className="status-value">{loading ? '—' : stats.leads.dormant}</span>
                <span className="status-label">Dormant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Email Metrics with Date Filter */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <Mail size={20} />
            Email Performance
          </h2>
          <div className="date-filter">
            <Calendar size={16} />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="date-select"
            >
              {dateRangeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="metrics-grid email-metrics">
          {/* Emails Sent */}
          <div className="metric-card email-sent">
            <div className="metric-icon sent">
              <Send size={24} />
            </div>
            <div className="metric-content">
              <span className="metric-value">{emailLoading ? '—' : emailStats.sent}</span>
              <span className="metric-label">Emails Sent</span>
            </div>
          </div>

          {/* Percentage Delivered */}
          <div className="metric-card percentage-card">
            <div className="metric-icon delivered">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-content">
              <div className="percentage-display">
                <span className="percentage-value">
                  {emailLoading ? '—' : `${emailStats.deliveredPercent}%`}
                </span>
                <span className="percentage-sublabel">Delivered</span>
              </div>
              <div className="metric-count">
                {emailLoading ? '—' : `${emailStats.delivered} of ${emailStats.sent}`}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill delivered" 
                  style={{ width: `${emailStats.deliveredPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Percentage Clicked/Opened */}
          <div className="metric-card percentage-card">
            <div className="metric-icon clicked">
              <MousePointerClick size={24} />
            </div>
            <div className="metric-content">
              <div className="percentage-display">
                <span className="percentage-value">
                  {emailLoading ? '—' : `${emailStats.clickedPercent}%`}
                </span>
                <span className="percentage-sublabel">Opened/Clicked</span>
              </div>
              <div className="metric-count">
                {emailLoading ? '—' : `${emailStats.clicked} opened of ${emailStats.delivered} delivered`}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill clicked" 
                  style={{ width: `${emailStats.clickedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Response Rate */}
          <div className="metric-card percentage-card response-rate-card">
            <div className="metric-icon response">
              <Reply size={24} />
            </div>
            <div className="metric-content">
              <div className="percentage-display">
                <span className="percentage-value">
                  {responseRateLoading ? '—' : `${responseRate.responseRate}%`}
                </span>
                <span className="percentage-sublabel">Response Rate</span>
              </div>
              <div className="metric-count">
                {responseRateLoading ? '—' : `${responseRate.totalReplied} of ${responseRate.totalContacted} contacted`}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill response" 
                  style={{ width: `${responseRate.responseRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Activity Trends */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <BarChart3 size={20} />
            Activity Trends
          </h2>
          <div className="date-filter">
            <button 
              className={`trend-toggle ${trendPeriod === 'weekly' ? 'active' : ''}`}
              onClick={() => setTrendPeriod('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`trend-toggle ${trendPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setTrendPeriod('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
        
        <div className="trends-card">
          {trendsLoading ? (
            <div className="trends-loading">Loading trends...</div>
          ) : trends.length === 0 ? (
            <div className="trends-empty">No trend data available</div>
          ) : (
            <>
              <div className="trends-legend">
                <div className="legend-item">
                  <span className="legend-dot leads"></span>
                  <span>Leads Added</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot emails"></span>
                  <span>Emails Sent</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot replies"></span>
                  <span>Replies</span>
                </div>
              </div>
              
              <div className="trends-chart">
                {trends.map((point, index) => (
                  <div key={index} className="trend-bar-group">
                    <div className="trend-bars">
                      <div 
                        className="trend-bar leads" 
                        style={{ height: `${(point.leads_added / maxTrendValue) * 100}%` }}
                        title={`Leads: ${point.leads_added}`}
                      >
                        {point.leads_added > 0 && (
                          <span className="bar-value">{point.leads_added}</span>
                        )}
                      </div>
                      <div 
                        className="trend-bar emails" 
                        style={{ height: `${(point.emails_sent / maxTrendValue) * 100}%` }}
                        title={`Emails: ${point.emails_sent}`}
                      >
                        {point.emails_sent > 0 && (
                          <span className="bar-value">{point.emails_sent}</span>
                        )}
                      </div>
                      <div 
                        className="trend-bar replies" 
                        style={{ height: `${(point.replies_received / maxTrendValue) * 100}%` }}
                        title={`Replies: ${point.replies_received}`}
                      >
                        {point.replies_received > 0 && (
                          <span className="bar-value">{point.replies_received}</span>
                        )}
                      </div>
                    </div>
                    <span className="trend-label">{point.period_label}</span>
                  </div>
                ))}
              </div>
              
              {/* Trend Summary */}
              <div className="trends-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Leads Added</span>
                  <span className="summary-value">
                    {trends.reduce((sum, t) => sum + t.leads_added, 0)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Emails Sent</span>
                  <span className="summary-value">
                    {trends.reduce((sum, t) => sum + t.emails_sent, 0)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Replies</span>
                  <span className="summary-value">
                    {trends.reduce((sum, t) => sum + t.replies_received, 0)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Empty State / CTA */}
      {!loading && stats.businesses === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <TrendingUp size={48} />
          </div>
          <h3>Ready to grow your business?</h3>
          <p>Start by adding businesses to discover potential leads and grow your customer base.</p>
          <Link to="/leads">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
