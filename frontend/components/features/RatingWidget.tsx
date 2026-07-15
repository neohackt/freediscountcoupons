'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RatingWidgetProps {
  storeId: number;
  storeName: string;
  initialRating?: number;
  initialVotes?: number;
}

export function RatingWidget({ storeId, storeName, initialRating = 0, initialVotes = 0 }: RatingWidgetProps) {
  const [rating, setRating] = useState(initialRating);
  const [votes, setVotes] = useState(initialVotes);
  const [hoverRating, setHoverRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedRatings = localStorage.getItem('storeRatings');
    if (storedRatings) {
      const ratings = JSON.parse(storedRatings);
      if (ratings[storeId]) {
        setHasRated(true);
        setUserRating(ratings[storeId]);
      }
    }
    const storedStats = localStorage.getItem(`ratingStats_${storeId}`);
    if (storedStats) {
      const stats = JSON.parse(storedStats);
      setRating(stats.rating || initialRating);
      setVotes(stats.votes || initialVotes);
    }
  }, [storeId, initialRating, initialVotes]);

  const handleRate = async (selectedRating: number) => {
    if (hasRated || isSubmitting) return;

    setIsSubmitting(true);
    setUserRating(selectedRating);
    
    const storedRatings = localStorage.getItem('storeRatings') || '{}';
    const ratings = JSON.parse(storedRatings);
    ratings[storeId] = selectedRating;
    localStorage.setItem('storeRatings', JSON.stringify(ratings));

    const storedStats = localStorage.getItem(`ratingStats_${storeId}`);
    const stats = storedStats ? JSON.parse(storedStats) : { rating: initialRating, votes: initialVotes };
    
    const totalScore = (stats.rating * stats.votes) + selectedRating;
    const newVotes = stats.votes + 1;
    const newRating = Math.round((totalScore / newVotes) * 10) / 10;
    
    localStorage.setItem(`ratingStats_${storeId}`, JSON.stringify({ rating: newRating, votes: newVotes }));
    
    setRating(newRating);
    setVotes(newVotes);
    setHasRated(true);
    setMessage('Thanks for rating!');
    setIsSubmitting(false);

    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, rating: selectedRating }),
      });
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  };

  const getStarFill = (star: number) => {
    if (hoverRating > 0) {
      return star <= hoverRating ? 'full' : star <= Math.floor(hoverRating) + 0.5 ? 'half' : 'empty';
    }
    if (userRating > 0 && hasRated) {
      return star <= userRating ? 'full' : 'empty';
    }
    if (rating > 0) {
      return star <= Math.floor(rating) ? 'full' : star === Math.ceil(rating) && rating % 1 >= 0.5 ? 'half' : 'empty';
    }
    return 'empty';
  };

  const renderStar = (star: number, fillType: 'full' | 'half' | 'empty') => {
    const filledClass = fillType === 'full' 
      ? 'text-yellow-400' 
      : fillType === 'half' 
        ? 'text-yellow-400' 
        : 'text-gray-300';
    
    return (
      <svg
        className={cn('w-6 h-6 transition-colors', filledClass)}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        {fillType === 'half' ? (
          <>
            <defs>
              <linearGradient id={`half-${star}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-${star})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </>
        ) : (
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        )}
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4">RATE {storeName.toUpperCase()}</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const fillType = getStarFill(star);
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                onMouseEnter={() => !hasRated && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={hasRated}
                className={cn('focus:outline-none', hasRated ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform')}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                {renderStar(star, fillType)}
              </button>
            );
          })}
        </div>
        <span className="text-sm font-medium text-gray-600">
          {rating > 0 ? `${rating}/5` : '-/5'}
        </span>
      </div>

      {message && (
        <p className="text-sm text-green-600 mb-3">{message}</p>
      )}

      {hasRated ? (
        <p className="text-sm text-gray-500">
          You rated this {userRating} star{userRating > 1 ? 's' : ''}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => handleRate(userRating || 5)}
          disabled={!userRating || isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          <span className="font-medium">{votes}</span> votes total
        </p>
        {votes > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Average rating of {rating} out of {votes} reviews
          </p>
        )}
      </div>
    </div>
  );
}