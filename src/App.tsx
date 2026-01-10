import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { SearchPage } from './pages/search/SearchPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { LeadsPage } from './pages/leads/LeadsPage';
import { ContactEmailsPage } from './pages/contacts/ContactEmailsPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { BusinessesPage } from './pages/businesses/BusinessesPage';
import { CampaignsPage } from './pages/campaigns/CampaignsPage';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected Routes with Dashboard Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/search" element={<SearchPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/businesses" element={<BusinessesPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/performance" element={<DashboardHome />} />
                <Route path="/dashboard/contacts/:contactId/emails" element={<ContactEmailsPage />} />
              </Route>
              
              {/* Default redirect for unknown routes */}
              <Route path="/dashboard" element={<Navigate to="/search" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
