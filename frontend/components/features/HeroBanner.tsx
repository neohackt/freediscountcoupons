import { BRAND_CONFIG } from '@/lib/constants';
import SearchBar from './SearchBar';

export function HeroBanner() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {BRAND_CONFIG.tagline}
        </h1>
        <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Find the best coupons, promo codes, and deals from thousands of stores.
          Start saving today with verified discount codes.
        </p>
        <div className="hero-search-wrapper">
          <div className="search-group">
            <SearchBar />
          </div>
        </div>
      </div>
    </div>
  );
}