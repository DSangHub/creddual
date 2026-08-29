// frontend/src/pages/consumer/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  Wallet, 
  Star, 
  TrendingUp,
  CreditCard,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default ConsumerDashboard;
