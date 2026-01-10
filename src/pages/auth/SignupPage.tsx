import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, Phone, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from '../../hooks/useForm';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Logo } from '../../components/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import type { SignupRequest } from '../../types/auth.types';

interface SignupFormValues extends SignupRequest {
  confirmPassword: string;
}

const validateSignup = (values: SignupFormValues): Partial<Record<keyof SignupFormValues, string>> => {
  const errors: Partial<Record<keyof SignupFormValues, string>> = {};

  if (!values.first_name.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!values.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!values.account_code.trim()) {
    errors.account_code = 'Account code is required';
  }

  return errors;
};

const benefits = [
  'Discover warm leads from Google Maps automatically',
  'Replace expensive agency fees with automation',
  'Personalized outreach campaigns that convert',
  'Track every lead from discovery to close',
  'Built for HVAC, Janitorial, Landscaping & more',
];

const industries = [
  'HVAC & Plumbing',
  'Janitorial Services',
  'Landscaping',
  'Roofing',
  'Electrical',
  'Pest Control',
];

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm<SignupFormValues>({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      account_code: '',
      contact: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    validate: validateSignup,
    onSubmit: async (formValues) => {
      const { confirmPassword, ...signupData } = formValues;
      await signup(signupData);
      navigate('/dashboard');
    },
  });

  return (
    <div className="auth-page-modern">
      {/* Left Panel - Value Proposition */}
      <div className="auth-hero-panel signup-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-header">
            <Logo size="xl" />
            <h1>Ceevaa</h1>
            <p className="auth-hero-tagline">
              Stop Overpaying for Leads
            </p>
          </div>

          <div className="auth-hero-pitch">
            <h2>
              <Sparkles size={24} className="sparkle-icon" />
              Automated Lead Generation for Local Service Businesses
            </h2>
            <p>
              Replace expensive agency-driven lead generation with our automated 
              warm-lead discovery and outreach platform. Find, contact, and 
              convert local business prospects at a fraction of the cost.
            </p>
          </div>

          <div className="auth-benefits-list">
            {benefits.map((benefit, index) => (
              <div key={index} className="auth-benefit-item">
                <CheckCircle2 size={20} className="benefit-check" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="auth-industries">
            <p className="industries-label">Built for:</p>
            <div className="industries-tags">
              {industries.map((industry, index) => (
                <span key={index} className="industry-tag">{industry}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-hero-footer">
          <div className="auth-testimonial">
            <p>"Cut our lead acquisition costs by 80% in the first month"</p>
            <span>— Local HVAC Business Owner</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <ThemeToggle />
        </div>

        <div className="auth-form-container signup-form">
          <div className="auth-form-title">
            <h2>Create your account</h2>
            <p>Start generating quality leads in minutes</p>
          </div>

          {submitError && (
            <Alert type="error" message={submitError} className="auth-alert" />
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <Input
                label="First Name"
                name="first_name"
                type="text"
                placeholder="John"
                icon={<User size={18} />}
                value={values.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.first_name ? errors.first_name : undefined}
                autoComplete="given-name"
              />
              <Input
                label="Last Name"
                name="last_name"
                type="text"
                placeholder="Doe"
                icon={<User size={18} />}
                value={values.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.last_name ? errors.last_name : undefined}
                autoComplete="family-name"
              />
            </div>

            <Input
              label="Work Email"
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
              label="Account Code"
              name="account_code"
              type="text"
              placeholder="Enter your organization's code"
              icon={<Building2 size={18} />}
              value={values.account_code}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.account_code ? errors.account_code : undefined}
              hint="Contact your administrator if you don't have one"
            />

            <Input
              label="Phone Number (Optional)"
              name="contact"
              type="tel"
              placeholder="+1 (555) 000-0000"
              icon={<Phone size={18} />}
              value={values.contact}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="tel"
            />

            <div className="form-row">
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Min. 8 characters"
                icon={<Lock size={18} />}
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : undefined}
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                icon={<Lock size={18} />}
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="auth-submit-btn"
            >
              Create Account
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-form-bottom">
          <p>
            By creating an account, you agree to our{' '}
            <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};
