// frontend/src/pages/consumer/Profile.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { User, CreditCard, Building2, Star } from 'lucide-react';

const ConsumerProfile = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [cardForm, setCardForm] = useState({ debitCardLast4: '', linkedBank: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, banksRes] = await Promise.all([
        axios.get('/api/consumers/profile', { headers }),
        axios.get('/api/consumers/partner-banks', { headers }).catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.data);
      setBanks(banksRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLinkCard = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/consumers/link-debit', cardForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Debit card linked successfully!');
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not link card.');
    }
  };

  const handleReferBank = async (fiId) => {
    setMessage('');
    try {
      await axios.post('/api/consumers/refer-bank', { fiId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Referral submitted! The bank will contact you soon.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not submit referral.');
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>

        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
            {message}
          </div>
        )}

        {/* Account info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" /> Account
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">
                {profile?.user?.firstName} {profile?.user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{profile?.user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{profile?.user?.phone || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Rewards</p>
              <p className="font-medium text-green-600 flex items-center gap-1">
                <Star className="h-4 w-4" /> ${profile?.totalRewards?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Debit card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" /> Debit Card
          </h2>
          {profile?.debitCardLast4 ? (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white max-w-sm">
              <p className="text-blue-200 text-sm">Linked card</p>
              <p className="text-xl font-mono mt-2">•••• •••• •••• {profile.debitCardLast4}</p>
              {profile.linkedBank && <p className="text-blue-100 text-sm mt-2">{profile.linkedBank}</p>}
            </div>
          ) : (
            <form onSubmit={handleLinkCard} className="space-y-4 max-w-sm">
              <p className="text-sm text-gray-600">Link your debit card to start earning rewards.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card last 4 digits</label>
                <input
                  type="text"
                  required
                  pattern="\d{4}"
                  maxLength={4}
                  value={cardForm.debitCardLast4}
                  onChange={(e) => setCardForm({ ...cardForm, debitCardLast4: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank name</label>
                <input
                  type="text"
                  required
                  value={cardForm.linkedBank}
                  onChange={(e) => setCardForm({ ...cardForm, linkedBank: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                Link Card
              </button>
            </form>
          )}
        </div>

        {/* Partner banks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" /> Partner Banks
          </h2>
          {banks.length === 0 ? (
            <p className="text-sm text-gray-500">No partner banks available yet.</p>
          ) : (
            <div className="space-y-3">
              {banks.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-gray-900">{bank.institutionName}</p>
                    <p className="text-sm text-gray-500">{bank.institutionType} · {bank.city}, {bank.state}</p>
                  </div>
                  <button
                    onClick={() => handleReferBank(bank.id)}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                  >
                    Open Account
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumerProfile;
