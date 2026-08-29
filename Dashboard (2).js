// frontend/src/pages/merchant/Dashboard.js

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
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default MerchantDashboard;
