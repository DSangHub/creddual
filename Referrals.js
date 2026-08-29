// frontend/src/pages/financial-institution/Referrals.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Users, CheckCircle } from 'lucide-react';

const statusStyles = {
  COMPLETED: 'bg-green-100 text-green-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const FIReferrals = () => {
  const { token } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/financial/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferrals(res.data);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const updateStatus = async (referralId, status) => {
    try {
      await axios.put(`/api/financial/referrals/${referralId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchReferrals();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referrals</h1>
          <p className="text-gray-600 mt-1">Manage account-opening applications</p>
        </div>

        {referrals.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No referrals yet. Consumers who choose your institution will appear here.</p>
          </div>
        ) : (
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
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {referral.consumer?.user?.firstName} {referral.consumer?.user?.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{referral.consumer?.user?.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[referral.status] || 'bg-gray-100 text-gray-800'}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">${referral.referralFee}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {referral.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateStatus(referral.id, 'APPROVED')}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(referral.id, 'COMPLETED')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                        {referral.status === 'APPROVED' && (
                          <button
                            onClick={() => updateStatus(referral.id, 'COMPLETED')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Mark Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FIReferrals;
