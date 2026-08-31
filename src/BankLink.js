import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, ShieldCheck, Unlink } from 'lucide-react';

const PLAID_SCRIPT = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';

function loadPlaid() {
  if (window.Plaid) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PLAID_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = PLAID_SCRIPT;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function BankLink() {
  const [busy, setBusy] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState('');
  const [environment, setEnvironment] = useState('');

  useEffect(() => {
    loadPlaid().catch(() => setMessage('The secure bank-link window could not load.'));
  }, []);

  const syncTransactions = async () => {
    setBusy(true);
    setMessage('');
    try {
      const result = await api('/api/plaid/transactions');
      setMatches(result.rewardMatches || []);
      setMessage(result.transactions?.length
        ? `Checked ${result.transactions.length} recent transaction(s).`
        : 'Your bank is still preparing transaction data. Check again shortly.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    setMessage('');
    try {
      await loadPlaid();
      const setup = await api('/api/plaid/create-link-token', { method: 'POST', body: '{}' });
      setEnvironment(setup.environment);
      const handler = window.Plaid.create({
        token: setup.link_token,
        onSuccess: async publicToken => {
          try {
            const linked = await api('/api/plaid/exchange-public-token', {
              method: 'POST',
              body: JSON.stringify({ public_token: publicToken }),
            });
            setAccounts(linked.accounts || []);
            setEnvironment(linked.environment);
            setMessage('Account linked. Creddual can now check eligible purchases.');
            await syncTransactions();
          } catch (error) {
            setMessage(error.message);
          } finally {
            setBusy(false);
          }
        },
        onExit: error => {
          if (error) setMessage('Bank linking was not completed. Please try again.');
          setBusy(false);
        },
      });
      handler.open();
    } catch (error) {
      setMessage(error.message);
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    try {
      await api('/api/plaid/unlink', { method: 'POST', body: '{}' });
      setAccounts([]);
      setMatches([]);
      setMessage('The linked account was removed from this device.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-16 bg-blue-50" id="link-account">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-xl p-3">
              <CreditCard className="h-7 w-7 text-blue-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Link your debit account</h2>
              <p className="text-gray-600 mt-2">
                Use a secure Plaid connection to identify eligible purchases from partner merchants.
                Creddual never receives your bank password or full account number.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-700 mt-3">
                <ShieldCheck className="h-4 w-4" />
                Permission-based and read-only for transaction matching
              </div>
            </div>
          </div>

          {environment === 'sandbox' && (
            <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              Sandbox demonstration — do not enter a real bank account.
            </div>
          )}

          {accounts.length > 0 ? (
            <div className="mt-6">
              <div className="space-y-3">
                {accounts.map(account => (
                  <div key={account.id} className="border rounded-lg p-4 flex justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{account.officialName || account.name}</p>
                      <p className="text-sm text-gray-500">{account.subtype || account.type}</p>
                    </div>
                    <span className="font-mono text-gray-600">•••• {account.mask || '----'}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <button onClick={syncTransactions} disabled={busy} className="bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Check purchases
                </button>
                <button onClick={unlink} disabled={busy} className="border px-5 py-3 rounded-lg font-semibold text-gray-700 disabled:opacity-50 flex items-center gap-2">
                  <Unlink className="h-4 w-4" /> Unlink
                </button>
              </div>
            </div>
          ) : (
            <button onClick={connect} disabled={busy} className="mt-6 w-full sm:w-auto bg-blue-700 text-white px-7 py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:opacity-50">
              {busy ? 'Opening secure connection…' : 'Link Debit Account'}
            </button>
          )}

          {message && <p className="mt-4 text-sm text-gray-700" role="status">{message}</p>}

          {matches.length > 0 && (
            <div className="mt-6 border-t pt-5">
              <h3 className="font-bold text-gray-900">Reward-eligible purchases</h3>
              <div className="mt-3 space-y-2">
                {matches.map(transaction => (
                  <div key={transaction.id} className="flex justify-between text-sm bg-green-50 rounded-lg p-3">
                    <span>{transaction.merchant} · {transaction.date}</span>
                    <span className="font-semibold">${Number(transaction.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
