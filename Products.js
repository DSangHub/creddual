// frontend/src/pages/consumer/Products.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Search, ShoppingBag, Star } from 'lucide-react';

const ConsumerProducts = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchProducts = useCallback(async (q) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/consumers/products', {
        params: q ? { search: q } : {},
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleBuy = async (product) => {
    try {
      setMessage('');
      const res = await axios.post(
        '/api/consumers/purchase',
        { productId: product.id, amount: product.discountedPrice || product.originalPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Purchase successful! You earned $${res.data.rewardEarned.toFixed(2)} in rewards.`);
      fetchProducts(search);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Purchase failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop Deals</h1>
            <p className="text-gray-600 mt-1">Earn rewards on every purchase</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); fetchProducts(search); }}
            className="relative w-full sm:w-80"
          >
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </form>
        </div>

        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No products available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      {product.merchant?.businessName && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.merchant.businessName}</p>
                      )}
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" /> {product.rewardPercentage}% back
                    </span>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.discountedPrice || product.originalPrice}
                    </span>
                    {product.discountedPrice && (
                      <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{product.inventory} left</span>
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

                  <button
                    onClick={() => handleBuy(product)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerProducts;
