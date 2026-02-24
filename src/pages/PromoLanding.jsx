import React, { useState, useEffect } from 'react';
import { Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ComplianceFooter from '../components/ComplianceFooter';

const PromoLandingPage = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Countdown timer to Feb 26, 2026
  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = new Date('2026-02-26').getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignUp = () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed');
      return;
    }
    navigate('/auth/signup');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Main Offer Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-12 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Founding Member Program</h1>
              <p className="text-lg text-blue-100 mb-4">Exclusive offer for early adopters</p>
              <div className="text-5xl font-bold text-white">₹799/month</div>
              <p className="text-blue-100 text-sm mt-2">Lock in your earning potential today</p>
            </div>

            <div className="px-8 py-8">
              {/* Countdown Timer */}
              <div className="mb-8 p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-6 h-6 text-red-600" />
                  <h2 className="text-lg font-bold text-red-800">Join before Feb 26th</h2>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{timeLeft.days}</div>
                    <div className="text-xs text-gray-600 uppercase">Days</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-600 uppercase">Hours</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-600 uppercase">Minutes</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{timeLeft.seconds}</div>
                    <div className="text-xs text-gray-600 uppercase">Seconds</div>
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Why Join Now?</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* The Hook */}
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-blue-900 mb-2">Lock Your Rate</h4>
                        <p className="text-sm text-blue-800">
                          Get the Founding Member rate of ₹799/month. This price is exclusive to early adopters.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6-Month Carryover */}
                  <div className="p-6 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-green-900 mb-2">6-Month Carryover</h4>
                        <p className="text-sm text-green-800">
                          Share with 15+ people per month and your referal continues for 6 months free!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Direct Commission */}
                  <div className="p-6 bg-purple-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-purple-900 mb-2">Earn 20-25% Commission</h4>
                        <p className="text-sm text-purple-800">
                          Direct commission on every user who signs up using your referral code and pays.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Unlimited Earning */}
                  <div className="p-6 bg-orange-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Users className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-orange-900 mb-2">Unlimited Earning Potential</h4>
                        <p className="text-sm text-orange-800">
                          There's no cap on how many people you can refer. Build your network, earn passively.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Program Details</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Base Price:</strong> ₹799/month (flat rate for each member)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Commission Rate:</strong> 20-25% on each referred customer's payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Monthly Target:</strong> Share with 15+ people/month to get 6-month carryover referal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Earnings Wallet:</strong> Track all commissions in your dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">✓</span>
                    <span><strong>Valid Until:</strong> February 26, 2026</span>
                  </li>
                </ul>
              </div>

              {/* Terms Acceptance */}
              <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded mt-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <a href="#" className="text-indigo-600 hover:underline font-semibold">Terms and Conditions</a>, 
                    {' '}<a href="#" className="text-indigo-600 hover:underline font-semibold">Privacy Policy</a>, 
                    and understand this is a <strong>development-phase application</strong>. 
                    I will not upload real customer data.
                  </span>
                </label>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  onClick={handleSignUp}
                  disabled={!termsAccepted}
                  className={`flex-1 py-3 px-6 rounded-lg font-bold text-white text-lg transition-all ${
                    termsAccepted
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-lg cursor-pointer'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Join Founding Member Program
                </button>
                <button
                  onClick={() => navigate('/blog')}
                  className="flex-1 py-3 px-6 rounded-lg font-bold text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>Limited time offer • Exclusive to first 100 members • No hidden charges</p>
          </div>
        </div>
      </div>

      {/* Compliance Footer */}
      <ComplianceFooter />
    </div>
  );
};

export default PromoLandingPage;
