import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, Target, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import type { LoginRequest } from '../../types/auth.types';

const validateLogin = (values: LoginRequest): Partial<Record<keyof LoginRequest, string>> => {
  const errors: Partial<Record<keyof LoginRequest, string>> = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

const features = [
  {
    icon: Zap,
    title: 'Automated Discovery',
    description: 'Find warm leads automatically from Google Maps and local directories',
  },
  {
    icon: Target,
    title: 'Smart Outreach',
    description: 'Personalized email campaigns that convert prospects into customers',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    description: 'Real-time analytics and status tracking for every lead',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data is protected with industry-standard encryption',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm<LoginRequest>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: validateLogin,
    onSubmit: async (formValues) => {
      await login(formValues);
      navigate('/search');
    },
  });

  return (
    <div className="auth-page-modern">
      {/* Left Panel - Branding & Features */}
      <div className="auth-hero-panel">
        <div className="auth-hero-content">
          <div className="auth-hero-header">
            <Logo size="xl" />
            <h1>Ceevaa</h1>
            <p className="auth-hero-tagline">
              Lead Generation for Local Service Businesses
            </p>
          </div>

          <div className="auth-hero-features">
            {features.map((feature, index) => (
              <div key={index} className="auth-feature-item">
                <div className="auth-feature-icon">
                  <feature.icon size={20} />
                </div>
                <div className="auth-feature-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-hero-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">10x</span>
              <span className="auth-stat-label">Cheaper than agencies</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">85%</span>
              <span className="auth-stat-label">Time saved</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">3x</span>
              <span className="auth-stat-label">More leads</span>
            </div>
          </div>
        </div>

        <div className="auth-hero-footer">
          <p>Trusted by HVAC, Janitorial, Landscaping & more</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <ThemeToggle />
        </div>

        <div className="auth-form-container">
          <div className="auth-form-title">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {submitError && (
            <Alert type="error" message={submitError} className="auth-alert" />
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@company.com"
              icon={<Mail size={18} />}
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : undefined}
              autoComplete="email"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              icon={<Lock size={18} />}
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : undefined}
              autoComplete="current-password"
            />

            <div className="auth-options">
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="auth-submit-btn"
            >
              Sign In
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="auth-link">
                Get started free
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-form-bottom">
          <p>Protected by industry-standard encryption</p>
        </div>
      </div>
    </div>
  );
};
