import React, { useState, useEffect } from 'react';
import { Copy, Share2, TrendingUp, Users, Wallet, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ComplianceFooter from '../components/ComplianceFooter';

const ReferralDashboard = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    referralCode: 'FM-' + (user?.id?.substring(0, 8) || 'XXXXX').toUpperCase(),
    monthlyShares: 8, // Example: 8/15 this month
    targetShares: 15,
    referredCount: 12,
    paidCount: 5,
    totalEarnings: 8500, // ₹
    pendingEarnings: 2400,
    monthlyCarryover: false
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    const text = `Join me and lock in ₹799/month! Use my referral code: ${stats.referralCode}. Get 20-25% commission + 6-month free plan if you share with 15+ people. Valid until Feb 26! 🚀`;
    if (navigator.share) {
      navigator.share({
        title: 'Founding Member Program',
        text: text
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Link copied! Share it on your preferred platform.');
    }
  };

  const sharePercentage = Math.round((stats.monthlyShares / stats.targetShares) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Referral Dashboard</h1>
          <p className="text-blue-100">Track your referrals, shares, and earnings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Referral Code Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Referral Code</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border-2 border-indigo-200">
              <p className="text-sm text-gray-600 mb-2">Your unique referral code:</p>
              <p className="text-3xl font-bold text-indigo-600 font-mono">{stats.referralCode}</p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold"
              >
                <Copy className="w-5 h-5" />
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={shareCode}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Shares */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Monthly Shares</h3>
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-800">{stats.monthlyShares}</p>
              <p className="text-sm text-gray-500">Target: {stats.targetShares}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  sharePercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(sharePercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">{sharePercentage}% to carryover</p>
          </div>

          {/* Referred Users */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Referred Users</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats.referredCount}</p>
              <p className="text-sm text-green-600 font-semibold">{stats.paidCount} paid signups</p>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Total Earnings</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">From commissions</p>
            </div>
          </div>

          {/* Pending Earnings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Pending Earnings</h3>
              <Wallet className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600">₹{stats.pendingEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Awaiting payment</p>
            </div>
          </div>
        </div>

        {/* Carryover Status Card */}
        <div className={`rounded-xl shadow-md p-8 mb-8 ${
          stats.monthlyCarryover
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300'
        }`}>
          <div className="flex items-start gap-4">
            <Target className={`w-8 h-8 flex-shrink-0 ${
              stats.monthlyCarryover ? 'text-green-600' : 'text-amber-600'
            }`} />
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                stats.monthlyCarryover ? 'text-green-800' : 'text-amber-800'
              }`}>
                {stats.monthlyCarryover ? '✓ Carryover Active!' : '6-Month Carryover Status'}
              </h3>
              <p className={`text-sm mb-3 ${
                stats.monthlyCarryover ? 'text-green-700' : 'text-amber-700'
              }`}>
                {stats.monthlyCarryover
                  ? 'You met the 15+ shares target! Your ₹799 plan remains free for 6 months.'
                  : `Keep sharing! You need ${stats.targetShares - stats.monthlyShares} more shares this month to unlock the 6-month free plan.`
                }
              </p>
              {!stats.monthlyCarryover && (
                <div className="flex gap-2 text-xs text-amber-600 font-semibold">
                  <span>Progress: {sharePercentage}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                  1
                </div>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Share Your Code</h4>
              <p className="text-sm text-gray-600">
                Give your referral code to friends, colleagues, or anyone interested in the program.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                  2
                </div>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">They Sign Up</h4>
              <p className="text-sm text-gray-600">
                They sign up using your code and make their first payment of ₹799.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600">
                  3
                </div>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Earn Commission</h4>
              <p className="text-sm text-gray-600">
                Earn 20-25% commission on their first payment. Get bonus if they continue.
              </p>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Referrals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Referral Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Shared On</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'FM-ABC123', status: 'PAID', date: '2026-02-10', earnings: 500 },
                  { code: 'FM-DEF456', status: 'SIGNED_UP', date: '2026-02-09', earnings: 400 },
                  { code: 'FM-GHI789', status: 'PENDING', date: '2026-02-08', earnings: 0 },
                  { code: 'FM-JKL012', status: 'PAID', date: '2026-02-07', earnings: 600 },
                ].map((ref, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                    <td className="py-4 px-4 font-mono text-gray-800">{ref.code}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ref.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        ref.status === 'SIGNED_UP' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{ref.date}</td>
                    <td className="py-4 px-4 text-right font-semibold text-gray-800">
                      ₹{ref.earnings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Compliance Footer */}
      <ComplianceFooter />
    </div>
  );
};

export default ReferralDashboard;
