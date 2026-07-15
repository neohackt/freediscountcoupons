'use client';

import { useState } from 'react';
import { BRAND_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Simulate API call (replace with actual newsletter API)
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  return (
    <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Get coupon codes and online deals delivered straight to your inbox
        </h2>
        <p className="text-gray-600 mb-6">
          Join thousands of savvy shoppers who save money every day with our curated deals.
        </p>

        {status === 'success' ? (
          <div className="bg-green-100 text-green-800 px-6 py-4 rounded-lg inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            You're subscribed! Check your inbox for exclusive deals.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}