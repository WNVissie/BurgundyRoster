import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
const ReportsPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p>Coming soon...</p></div>;
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Roster } from './pages/Roster';
import { Admin } from './pages/Admin';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


import { Analytics } from './pages/Analytics';
import Timesheets from './pages/Timesheets.jsx';
// const ReportsPage = ... (leave as is)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/roster" element={
              <ProtectedRoute>
                <Layout>
                  <Roster />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/employees" element={
              <ProtectedRoute requiredRole="Manager">
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/timesheets" element={
              <ProtectedRoute>
                <Layout>
                  <Timesheets />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute requiredPermission="view_analytics">
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute requiredRole="Manager">
                <Layout>
                  <ReportsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="Admin">
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
