'use client';

import React, { useState } from 'react';

interface FeedbackProps {
  requestId: string;
  response: string;
  onFeedbackSubmit: (feedback: {
    rating: 1 | 2 | 3 | 4 | 5;
    feedback: string;
    responseQuality: 'poor' | 'fair' | 'good' | 'excellent';
    improvementSuggestions?: string;
  }) => void;
}

export default function FeedbackComponent({ requestId, response, onFeedbackSubmit }: FeedbackProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [feedback, setFeedback] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRatingClick = (selectedRating: 1 | 2 | 3 | 4 | 5) => {
    setRating(selectedRating);
  };

  const getResponseQuality = (rating: number): 'poor' | 'fair' | 'good' | 'excellent' => {
    if (rating <= 2) return 'poor';
    if (rating === 3) return 'fair';
    if (rating === 4) return 'good';
    return 'excellent';
  };

  const handleSubmit = () => {
    if (rating) {
      onFeedbackSubmit({
        rating,
        feedback,
        responseQuality: getResponseQuality(rating),
        improvementSuggestions: improvementSuggestions || undefined,
      });
      setIsSubmitted(true);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (isSubmitted) {
    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-700 text-sm">Thank you for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Rate this response</h4>
        <button
          onClick={handleExpand}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Less' : 'More'}
        </button>
      </div>

      {/* Star Rating */}
      <div className="flex items-center space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingClick(star as 1 | 2 | 3 | 4 | 5)}
            className={`w-6 h-6 ${
              rating && star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-xs text-gray-500">
          {rating ? `${rating}/5` : 'Click to rate'}
        </span>
      </div>

      {/* Quick Feedback */}
      <div className="mb-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what you think about this response..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
      </div>

      {/* Expanded Feedback Options */}
      {isExpanded && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            How can we improve? (Optional)
          </label>
          <textarea
            value={improvementSuggestions}
            onChange={(e) => setImprovementSuggestions(e.target.value)}
            placeholder="Suggestions for better responses..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
      )}

      {/* Quality Indicators */}
      {rating && (
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Quality:</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              getResponseQuality(rating) === 'poor' ? 'bg-red-100 text-red-800' :
              getResponseQuality(rating) === 'fair' ? 'bg-yellow-100 text-yellow-800' :
              getResponseQuality(rating) === 'good' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {getResponseQuality(rating).charAt(0).toUpperCase() + getResponseQuality(rating).slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!rating}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            rating
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit Feedback
        </button>
      </div>

      {/* Request ID for debugging */}
      <div className="mt-2 text-xs text-gray-400">
        Request ID: {requestId}
      </div>
    </div>
  );
} 