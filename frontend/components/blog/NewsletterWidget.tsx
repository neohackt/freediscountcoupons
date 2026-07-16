'use client';

import React, { useState } from 'react';

export default function NewsletterWidget() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 my-8 text-white">
      <span className="text-2xl mb-2 block">📬</span>
      <h3 className="font-bold text-lg mb-1">Never Miss a Deal</h3>
      <p className="text-blue-100 text-sm mb-4">
        Get the best coupons and deals delivered to your inbox weekly.
      </p>
      {submitted ? (
        <div className="bg-white/20 rounded-xl p-4 text-center">
          <p className="font-semibold">Thanks for subscribing!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
