// frontend/src/pages/Landing.js

import React from 'react';
import { Link } from 'react-router-dom';
import BankLink from './BankLink';
import { 
  CreditCard, 
  ShoppingBag, 
  Building2, 
  Star, 
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Gift,
  Lock
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container-custom py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Zap className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">Now Live — Join 10,000+ users</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Turn Your Debit Card
              <span className="block text-blue-200">Into a Rewards Powerhouse</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              No credit card? No problem. Shop, earn rewards, and save money with every purchase — 
              all with your everyday debit card.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="border-2 border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Sign In
              </Link>
            </div>
            
            <div className="flex items-center gap-6 mt-8 text-sm text-blue-200">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Secure & Free
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> 10K+ Members
              </span>
              <span className="flex items-center gap-1">
                <Gift className="h-4 w-4" /> Avg. $45/mo rewards
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">$12M+</p>
              <p className="text-sm text-gray-600">Total Rewards Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">50K+</p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">1,200+</p>
              <p className="text-sm text-gray-600">Partner Merchants</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">96%</p>
              <p className="text-sm text-gray-600">User Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How Creddual Works</h2>
            <p className="text-gray-600 mt-2">Three simple steps to start earning rewards</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">1. Link Your Debit Card</h3>
              <p className="text-gray-600 mt-2">Connect your existing debit card securely in seconds</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">2. Shop With Partners</h3>
              <p className="text-gray-600 mt-2">Discover exclusive deals from our merchant network</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">3. Earn & Save</h3>
              <p className="text-gray-600 mt-2">Get up to 15% back in rewards on every purchase</p>
            </div>
          </div>
        </div>
      </section>

      <BankLink />

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Creddual?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-6">
              <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Partner Banks</h3>
              <p className="text-gray-600 mt-2">No debit card? Open an account with our partner banks and start earning immediately.</p>
            </div>
            
            <div className="card p-6">
              <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Spend & Earn</h3>
              <p className="text-gray-600 mt-2">Meet weekly and monthly spending targets to unlock premium rewards and bonuses.</p>
            </div>
            
            <div className="card p-6">
              <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Exclusive Deals</h3>
              <p className="text-gray-600 mt-2">Access seasonal, discontinued, and slow-moving inventory at discounted prices.</p>
            </div>
            
            <div className="card p-6">
              <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Bank-Grade Security</h3>
              <p className="text-gray-600 mt-2">Your data is protected with enterprise-level encryption and security protocols.</p>
            </div>
            
            <div className="card p-6">
              <div className="bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Financial Inclusion</h3>
              <p className="text-gray-600 mt-2">No credit score required. Everyone deserves rewards, regardless of credit history.</p>
            </div>
            
            <div className="card p-6">
              <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Privacy First</h3>
              <p className="text-gray-600 mt-2">We never share your data. Your spending habits stay private and secure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are turning their debit cards into rewards machines.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
            Create Free Account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Creddual</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link to="/press" className="hover:text-white">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Consumers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link to="/rewards" className="hover:text-white">Rewards</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Merchants</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/merchants" className="hover:text-white">Partner With Us</Link></li>
                <li><Link to="/merchant-faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/success-stories" className="hover:text-white">Success Stories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2026 Creddual. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
