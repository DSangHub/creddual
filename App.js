// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ConsumerDashboard from './pages/consumer/Dashboard';
import ConsumerProducts from './pages/consumer/Products';
import ConsumerProfile from './pages/consumer/Profile';
import MerchantDashboard from './pages/merchant/Dashboard';
import MerchantProducts from './pages/merchant/Products';
import MerchantAnalytics from './pages/merchant/Analytics';
import FIDashboard from './pages/financial-institution/Dashboard';
import FIReferrals from './pages/financial-institution/Referrals';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Consumer Routes */}
            <Route path="/consumer/dashboard" element={<PrivateRoute><ConsumerDashboard /></PrivateRoute>} />
            <Route path="/consumer/products" element={<PrivateRoute><ConsumerProducts /></PrivateRoute>} />
            <Route path="/consumer/profile" element={<PrivateRoute><ConsumerProfile /></PrivateRoute>} />
            
            {/* Merchant Routes */}
            <Route path="/merchant/dashboard" element={<PrivateRoute><MerchantDashboard /></PrivateRoute>} />
            <Route path="/merchant/products" element={<PrivateRoute><MerchantProducts /></PrivateRoute>} />
            <Route path="/merchant/analytics" element={<PrivateRoute><MerchantAnalytics /></PrivateRoute>} />
            
            {/* FI Routes */}
            <Route path="/fi/dashboard" element={<PrivateRoute><FIDashboard /></PrivateRoute>} />
            <Route path="/fi/referrals" element={<PrivateRoute><FIReferrals /></PrivateRoute>} />
            
            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
