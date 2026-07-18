// ============================================
// Drishti Kavach — App Router
// Cyber-noir theme and error boundary implementation
// ============================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './components/ui/ThemeToggle';
import { ErrorBoundary, NotFoundPage, ServerErrorPage } from './components/ui/ErrorPages';
import { SuspenseFallback } from './components/ui/SkeletonLoader';

import LoginPage from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/Overview';
import SecurityEvents from './pages/SecurityEvents';
import IPManagement from './pages/IPManagement';
import Incidents from './pages/Incidents';
import Forms from './pages/Forms';
import DdosMonitor from './pages/DdosMonitor';
import DrishtiAI from './pages/DrishtiAI';
import Websites from './pages/Websites';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Credentials from './pages/Credentials';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Analytics from './pages/Analytics';
import MitreMatrix from './pages/MitreMatrix';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <SuspenseFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Lazy load components for better performance
const lazyLoad = (Component) => (
  <React.Suspense fallback={<SuspenseFallback />}>
    <Component />
  </React.Suspense>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/login" element={lazyLoad(LoginPage)} />
              <Route path="/privacy" element={lazyLoad(PrivacyPolicy)} />
              <Route path="/terms" element={lazyLoad(TermsConditions)} />
              
              {/* Error pages */}
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="/500" element={<ServerErrorPage />} />
              
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={lazyLoad(Overview)} />
                <Route path="security" element={lazyLoad(SecurityEvents)} />
                <Route path="ip" element={lazyLoad(IPManagement)} />
                <Route path="incidents" element={lazyLoad(Incidents)} />
                <Route path="forms" element={lazyLoad(Forms)} />
                <Route path="ddos" element={lazyLoad(DdosMonitor)} />
                <Route path="ai" element={lazyLoad(DrishtiAI)} />
                <Route path="websites" element={lazyLoad(Websites)} />
                <Route path="reports" element={lazyLoad(Reports)} />
                <Route path="users" element={<ProtectedRoute roles={['admin', 'superadmin']}><Users /></ProtectedRoute>} />
                <Route path="credentials" element={<ProtectedRoute roles={['superadmin']}><Credentials /></ProtectedRoute>} />
                <Route path="audit" element={<ProtectedRoute roles={['admin', 'superadmin']}><AuditLog /></ProtectedRoute>} />
                <Route path="settings" element={lazyLoad(Settings)} />
                <Route path="analytics" element={lazyLoad(Analytics)} />
                <Route path="mitre" element={lazyLoad(MitreMatrix)} />
              </Route>
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
