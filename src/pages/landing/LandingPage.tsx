import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCalApi } from "@calcom/embed-react";
import { 
  MapPin, 
  Mail, 
  Zap, 
  Target, 
  BarChart3, 
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Globe,
  TrendingUp,
  Linkedin,
  Building2
} from 'lucide-react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  // Initialize Cal.com embed
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: "demo" });
      cal("ui", {
        cssVarsPerTheme: {
          light: { "cal-brand": "#1B2D3F" },
          dark: { "cal-brand": "#B0C7DE" }
        },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    })();
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <img src="/logo.png" alt="CeeVaa" className="nav-logo" />
            <span className="nav-brand-text">CeeVaa</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link to="/login" className="nav-link-login">Login</Link>
            <button 
              className="nav-btn-primary"
              data-cal-namespace="demo"
              data-cal-link="ceevaa/demo"
              data-cal-config='{"layout":"month_view"}'
            >
              Request a demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient-orb hero-orb-1"></div>
          <div className="hero-gradient-orb hero-orb-2"></div>
          <div className="hero-grid-overlay"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Lead Generation</span>
          </div>
          
          <h1 className="hero-title">
            Automate Local<br />
            <span className="hero-title-accent">Business Growth</span>
          </h1>
          
          <p className="hero-subtitle">
            Automated lead generation from Google Maps with AI-powered personalized email outreach. 
            Find businesses, discover decision-makers, and close deals on autopilot.
          </p>

          <p className="hero-trust">
            Trusted by janitorial, HVAC, roofing, landscaping, and other local service businesses
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">CAPABILITIES</span>
            <h2 className="section-title">Lead generation, done for you.</h2>
            <p className="section-subtitle">
              CeeVaa automates the entire lead generation and outreach process to local businesses and properties
            </p>
          </div>

          <div className="features-grid">
            <FeatureCard
              icon={<MapPin />}
              title="Scrapes for Local Leads"
              description="Automatically scrapes Google Maps for local businesses and finds owner emails and contact information"
              accent="blue"
            />
            <FeatureCard
              icon={<Sparkles />}
              title="AI-Personalized Emails"
              description="AI automatically personalizes cold emails based on best practices and business context"
              accent="silver"
            />
            <FeatureCard
              icon={<Zap />}
              title="Automated Outreach"
              description="Automatically creates and manages email campaigns to target local leads at scale"
              accent="blue"
            />
            <FeatureCard
              icon={<Target />}
              title="Smart Targeting"
              description="Filter leads by industry, location, size, and more to find your ideal customers"
              accent="silver"
            />
            <FeatureCard
              icon={<BarChart3 />}
              title="Real-time Analytics"
              description="Track open rates, replies, and conversions with detailed performance dashboards"
              accent="blue"
            />
            <FeatureCard
              icon={<Users />}
              title="CRM Integration"
              description="Built-in CRM to manage leads, conversations, and follow-ups in one place"
              accent="silver"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">HOW IT WORKS</span>
            <h2 className="section-title">From search to sale in 3 steps</h2>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">
                <Globe size={32} />
              </div>
              <h3>Search Google Maps</h3>
              <p>Enter your target industry and location. CeeVaa scrapes Google Maps to find matching businesses.</p>
            </div>
            
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">
                <Mail size={32} />
              </div>
              <h3>AI Creates Emails</h3>
              <p>Our AI analyzes each business and generates personalized outreach emails that convert.</p>
            </div>
            
            <div className="step-connector">
              <ArrowRight size={24} />
            </div>
            
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">
                <TrendingUp size={32} />
              </div>
              <h3>Close Deals</h3>
              <p>Manage responses in your inbox, nurture leads, and convert prospects into customers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Leads Generated Daily</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">45%</div>
              <div className="stat-label">Average Open Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">12%</div>
              <div className="stat-label">Reply Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">5x</div>
              <div className="stat-label">ROI on Average</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">PRICING</span>
            <h2 className="section-title">Simple, transparent pricing</h2>
            <p className="section-subtitle">No long-term commitments. Cancel anytime.</p>
          </div>

          <div className="pricing-grid">
            {/* Starter Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">Starter</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">79</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="pricing-onboarding">+$49 one-time onboarding fee</p>
                <p className="pricing-description">Small operators just getting started</p>
              </div>
              
              <ul className="pricing-features">
                <PricingFeature text="Reach out to 10 businesses/day via email" />
                <PricingFeature text="Up to 1,500 email contacts/month" />
                <PricingFeature text="Standard email support (48-hour response)" />
                <PricingFeature text="One onboarding call included" />
              </ul>
            </div>

            {/* Growth Plan */}
            <div className="pricing-card pricing-card-featured">
              <div className="pricing-badge">Most Popular</div>
              <div className="pricing-header">
                <h3 className="pricing-name">Growth</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">129</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="pricing-onboarding">+$49 one-time onboarding fee</p>
                <p className="pricing-description">Growing businesses looking to scale up outreach</p>
              </div>
              
              <ul className="pricing-features">
                <PricingFeature text="Reach out to 30 businesses/day via email" />
                <PricingFeature text="Up to 4,500 email contacts/month" />
                <PricingFeature text="Customizable email templates" />
                <PricingFeature text="Priority email support (24-hour response)" />
                <PricingFeature text="Callback within 24 hours" />
                <PricingFeature text="Two onboarding calls (initial + follow-up)" />
              </ul>
            </div>

            {/* Managed Growth Plan */}
            <div className="pricing-card">
              <div className="pricing-header">
                <h3 className="pricing-name">Managed Growth</h3>
                <div className="pricing-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">499</span>
                  <span className="price-period">/month</span>
                </div>
                <p className="pricing-onboarding">+$49 per qualified walkthrough, includes onboarding</p>
                <p className="pricing-description">Fully managed solution with a dedicated rep</p>
              </div>
              
              <ul className="pricing-features">
                <PricingFeature text="Dedicated Sales Rep handles everything" />
                <PricingFeature text="Emails to cold calls, turning leads into walkthroughs" />
                <PricingFeature text="All Growth Plan benefits, fully managed" />
                <PricingFeature text="Dedicated account manager" />
                <PricingFeature text="Full onboarding and training sessions" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2>Ready to automate your lead generation?</h2>
            <p>Join hundreds of local service businesses that are growing with CeeVaa</p>
            <button 
              type="button" 
              className="cta-btn"
              data-cal-namespace="demo"
              data-cal-link="ceevaa/demo"
              data-cal-config='{"layout":"month_view"}'
            >
              Book Demo
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand-section">
              <div className="footer-brand">
                <img src="/logo.png" alt="CeeVaa" className="footer-logo" />
                <span className="footer-brand-text">CeeVaa</span>
              </div>
              <p className="footer-tagline">The next generation of growth for local businesses</p>
            </div>

            <div className="footer-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <Link to="/login">Login</Link>
            </div>

            <div className="footer-address">
              <div className="footer-address-title">
                <Building2 size={16} />
                <span>Ceevaasch Technologies Inc.</span>
              </div>
              <p>8 The Green, Suite D</p>
              <p>Dover, DE 19901, USA</p>
            </div>

            <div className="footer-social">
              <a 
                href="https://www.linkedin.com/company/ceevaa/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
                aria-label="Follow CeeVaa on LinkedIn"
              >
                <Linkedin size={22} />
              </a>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} CeeVaa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: 'blue' | 'silver';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, accent }) => {
  return (
    <div className={`feature-card feature-card-${accent}`}>
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

// Pricing Feature Component
const PricingFeature: React.FC<{ text: string }> = ({ text }) => {
  return (
    <li className="pricing-feature-item">
      <CheckCircle2 size={18} />
      <span>{text}</span>
    </li>
  );
};

export default LandingPage;

