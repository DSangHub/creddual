// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
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
            
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;// frontend/src/pages/consumer/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  Wallet, 
  ShoppingBag, 
  Star, 
  TrendingUp,
  CreditCard,
  Plus,
  ArrowRight
} from 'lucide-react';

const ConsumerDashboard = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    weeklySpend: 0,
    monthlySpend: 0,
    totalRewards: 0,
    rewardsEligible: false
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profileRes, productsRes] = await Promise.all([
        axios.get('/api/consumers/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/consumers/products', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setProfile(profileRes.data);
      setStats({
        weeklySpend: profileRes.data.weeklySpend || 0,
        monthlySpend: profileRes.data.monthlySpend || 0,
        totalRewards: profileRes.data.totalRewards || 0,
        rewardsEligible: profileRes.data.rewardsEligible || false
      });
      setProducts(productsRes.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Track your spending and earn rewards</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekly Spend</p>
                <p className="text-2xl font-bold text-gray-900">${stats.weeklySpend.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.weeklySpend / 100) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: $100/week</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Spend</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlySpend.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.monthlySpend / 400) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: $400/month</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalRewards.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
          </div>

          <div className={`rounded-xl shadow-sm p-6 border ${stats.rewardsEligible ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${stats.rewardsEligible ? 'text-green-700' : 'text-gray-700'}`}>
                  {stats.rewardsEligible ? '✅ Rewards Active' : '⏳ Spend More'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stats.rewardsEligible ? 'bg-green-100' : 'bg-gray-100'}`}>
                <CreditCard className={`h-6 w-6 ${stats.rewardsEligible ? 'text-green-700' : 'text-gray-500'}`} />
              </div>
            </div>
            {!stats.rewardsEligible && (
              <p className="text-xs text-gray-500 mt-1">
                Need ${(100 - stats.weeklySpend).toFixed(2)} more this week
              </p>
            )}
          </div>
        </div>

        {/* Link Debit Card CTA */}
        {!profile?.debitCardLast4 && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">🎯 Link Your Debit Card</h3>
                <p className="text-blue-100 text-sm">Start earning rewards on every purchase</p>
              </div>
              <button className="bg-white text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                Link Card <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* No Bank Account CTA */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">🏦 No Debit Card?</h3>
              <p className="text-green-100 text-sm">Open an account with our partner banks and start earning today</p>
            </div>
            <button className="bg-white text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-2">
              View Partners <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Featured Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Featured Deals</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      {product.rewardPercentage}% back
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.discountedPrice || product.originalPrice}
                    </span>
                    {product.discountedPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    {product.isSeasonal && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Seasonal</span>
                    )}
                    {product.isDiscontinued && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Discontinued</span>
                    )}
                    {product.isSlowMoving && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Limited Stock</span>
                    )}
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        {profile?.transactions?.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {profile.transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{tx.product?.name || 'Purchase'}</p>
                      <p className="text-sm text-gray-600">
                        {tx.merchant?.user?.firstName} {tx.merchant?.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${tx.amount.toFixed(2)}</p>
                      <p className="text-sm text-green-600">+${tx.rewardEarned.toFixed(2)} rewards</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerDashboard;// frontend/src/pages/merchant/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';

const MerchantDashboard = () => {
  const { token, user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, productsRes] = await Promise.all([
        axios.get('/api/merchants/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/merchants/products', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setDashboardData(dashboardRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await axios.post('/api/merchants/products', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboardData();
      setShowAddProduct(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Merchant Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {dashboardData?.merchant?.businessName}
            </p>
          </div>
          <button 
            onClick={() => setShowAddProduct(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardData?.stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.totalTransactions || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rewards Given</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dashboardData?.stats?.totalRewardsGiven?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Slow Moving Products */}
        {dashboardData?.slowMovingProducts?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              Slow Moving Inventory
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.slowMovingProducts.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <span className="text-sm text-gray-500">{product.inventory} units</span>
                  </div>
                  <p className="text-sm text-gray-600">{product.category}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-500">${product.originalPrice}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                      {product.rewardPercentage}% reward
                    </span>
                  </div>
                  <button className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Boost Promotion
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Products</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">${product.discountedPrice || product.originalPrice}</span>
                        {product.discountedPrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">${product.originalPrice}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.inventory}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-green-600">{product.rewardPercentage}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.isSeasonal && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Seasonal</span>}
                          {product.isDiscontinued && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Discontinued</span>}
                          {product.isSlowMoving && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Slow</span>}
                          {!product.isSeasonal && !product.isDiscontinued && !product.isSlowMoving && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:text-blue-700">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Product</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              handleAddProduct({
                ...data,
                originalPrice: parseFloat(data.originalPrice),
                discountedPrice: parseFloat(data.discountedPrice) || null,
                rewardPercentage: parseFloat(data.rewardPercentage) || 5,
                inventory: parseInt(data.inventory) || 10,
                isSeasonal: data.isSeasonal === 'on',
                isDiscontinued: data.isDiscontinued === 'on',
                isSlowMoving: data.isSlowMoving === 'on'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input type="text" name="name" required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea name="description" rows="3" className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input type="text" name="category" required className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Inventory</label>
                    <input type="number" name="inventory" required defaultValue="10" className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Original Price ($)</label>
                    <input type="number" name="originalPrice" required step="0.01" className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discounted Price ($)</label>
                    <input type="number" name="discountedPrice" step="0.01" className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reward Percentage (%)</label>
                  <input type="number" name="rewardPercentage" required step="0.5" defaultValue="5" className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Product Tags</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isSeasonal" />
                      <span className="text-sm">Seasonal</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isDiscontinued" />
                      <span className="text-sm">Discontinued</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isSlowMoving" />
                      <span className="text-sm">Slow Moving</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddProduct(false)} className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;// frontend/src/pages/financial-institution/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  Building2,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const FIDashboard = () => {
  const { token, user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/financial/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReferralStatus = async (referralId, status) => {
    try {
      await axios.put(`/api/financial/referrals/${referralId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating referral:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Institution Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {dashboardData?.fi?.institutionName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.stats?.totalReferrals || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.stats?.completedReferrals || 0}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.stats?.pendingReferrals || 0}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  ${dashboardData?.stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Referral Applications</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consumer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData?.referrals?.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {referral.consumer?.user?.firstName} {referral.consumer?.user?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {referral.consumer?.user?.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${referral.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
                          ${referral.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : ''}
                          ${referral.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                        `}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ${referral.referralFee}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {referral.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleReferralStatus(referral.id, 'APPROVED')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReferralStatus(referral.id, 'COMPLETED')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                        {referral.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleReferralStatus(referral.id, 'COMPLETED')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stats Chart Placeholder */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Growth</h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              <TrendingUp className="h-12 w-12" />
              <p className="ml-2">Chart coming soon</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              <DollarSign className="h-12 w-12" />
              <p className="ml-2">Chart coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIDashboard;
