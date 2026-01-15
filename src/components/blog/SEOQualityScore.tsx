'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface SEOScoreBreakdown {
  keywordUsage: number;
  contentStructure: number;
  readability: number;
  metaOptimization: number;
  technicalSEO: number;
}

interface SEOScoreData {
  score: number;
  grade: string;
  breakdown: SEOScoreBreakdown;
  issues: string[];
  recommendations: string[];
  current_score?: number | null;
  updated?: boolean;
}

interface SEOQualityScoreProps {
  postId: string;
  initialScore?: number | null;
  showDetails?: boolean;
}

export function SEOQualityScore({ postId, initialScore, showDetails = false }: SEOQualityScoreProps) {
  const [scoreData, setScoreData] = useState<SEOScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fetchScore = async (calculate: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = `/api/blog-posts/${postId}/seo-score`;
      const response = await fetch(endpoint, {
        method: calculate ? 'POST' : 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SEO score');
      }

      const data = await response.json();
      setScoreData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-green-50';
    if (score >= 70) return 'bg-yellow-50';
    if (score >= 60) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const getGradeColor = (grade: string): string => {
    if (grade === 'A') return 'bg-green-600';
    if (grade === 'B') return 'bg-green-500';
    if (grade === 'C') return 'bg-yellow-600';
    if (grade === 'D') return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className={`rounded-lg border p-4 ${scoreData ? getScoreBgColor(scoreData.score) : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">SEO Quality Score</span>
              {scoreData && (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl font-bold ${getScoreColor(scoreData.score)}`}>
                    {scoreData.score}
                  </span>
                  <span className="text-sm text-gray-500">/ 100</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-white text-sm font-semibold ${getGradeColor(scoreData.grade)}`}>
                    {scoreData.grade}
                  </span>
                </div>
              )}
              {!scoreData && initialScore !== null && initialScore !== undefined && (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl font-bold ${getScoreColor(initialScore)}`}>
                    {initialScore}
                  </span>
                  <span className="text-sm text-gray-500">/ 100</span>
                </div>
              )}
              {!scoreData && (initialScore === null || initialScore === undefined) && (
                <span className="text-sm text-gray-400 mt-1">Not calculated yet</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchScore(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Calculating...' : 'Calculate Score'}
            </button>
            {scoreData && (
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                {showBreakdown ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Breakdown */}
      {scoreData && showBreakdown && (
        <div className="space-y-4">
          {/* Score Breakdown */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Score Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(scoreData.breakdown).map(([key, value]) => {
                const maxScores: Record<string, number> = {
                  keywordUsage: 25,
                  contentStructure: 25,
                  readability: 20,
                  metaOptimization: 15,
                  technicalSEO: 15,
                };
                const max = maxScores[key] || 25;
                const percentage = (value / max) * 100;
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());

                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className="text-sm text-gray-600">
                        {value} / {max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Issues */}
          {scoreData.issues.length > 0 && (
            <div className="bg-red-50 rounded-lg border border-red-200 p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Issues Found ({scoreData.issues.length})
              </h3>
              <ul className="space-y-1">
                {scoreData.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {scoreData.recommendations.length > 0 && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Recommendations ({scoreData.recommendations.length})
              </h3>
              <ul className="space-y-1">
                {scoreData.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
