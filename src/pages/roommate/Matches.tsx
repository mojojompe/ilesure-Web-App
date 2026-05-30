import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Heart, User, CheckCircle, AlertTriangle, Star, TrendingUp, Info, ThumbsUp } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { roommateApi } from '../../api/roommate';
import type { MatchWithUser } from '../../api/roommate';

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50';
  if (score >= 65) return 'text-blue-600 bg-blue-50';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

function getRecommendationColor(rec: string): string {
  if (rec === 'excellent') return 'border-green-200 bg-green-50';
  if (rec === 'good') return 'border-blue-200 bg-blue-50';
  if (rec === 'fair') return 'border-yellow-200 bg-yellow-50';
  return 'border-red-200 bg-red-50';
}

function getRecommendationIcon(rec: string) {
  if (rec === 'excellent') return <Star className="w-5 h-5 text-green-600" />;
  if (rec === 'good') return <ThumbsUp className="w-5 h-5 text-blue-600" />;
  return <Info className="w-5 h-5 text-yellow-600" />;
}

export function RoommateMatchesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [page]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await roommateApi.getMatches(page, 20);
      if (response.success && response.data) {
        setMatches(response.data.matches || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async (matchId: string) => {
    try {
      const response = await roommateApi.expressInterest(matchId);
      if (response.success) {
        alert(response.message || 'Interest expressed!');
        fetchMatches();
      }
    } catch (error) {
      console.error('Failed to express interest:', error);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AppLayout
      role="student"
      title="AI Roommate Matches"
      subtitle="Powered by our intelligent matching algorithm"
    >
      <div className="max-w-4xl mx-auto">
        {/* AI Badge */}
        <div className="flex items-center gap-2 mb-6 text-sm text-mustard font-medium">
          <Sparkles className="w-4 h-4" />
          AI-Powered Matching Active
          <span className="text-text-tertiary">•</span>
          <span className="text-text-secondary">{total} potential matches found</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mustard"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="clay-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-mustard/10 flex items-center justify-center">
              <User className="w-8 h-8 text-mustard" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Matches Yet</h3>
            <p className="text-text-secondary mb-4">
              Complete your roommate profile to see AI-powered matches
            </p>
            <button
              onClick={() => navigate('/roommate/profile')}
              className="px-6 py-3 bg-mustard text-white rounded-clay-sm font-medium hover:bg-mustard/90"
            >
              Complete Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className={`clay-card p-6 border-2 transition-all cursor-pointer hover:shadow-lg ${getRecommendationColor(match.recommendation)}`}
                onClick={() => setSelectedMatch(selectedMatch === match.id ? null : match.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-mustard/10 flex items-center justify-center overflow-hidden">
                      {match.avatar ? (
                        <img src={match.avatar} alt={match.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-mustard" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{match.fullName}</h3>
                      <p className="text-sm text-text-secondary">
                        {match.bInterested ? 'Mutual interest!' : match.aInterested ? 'You expressed interest' : 'New match'}
                      </p>
                    </div>
                  </div>

                  {/* AI Score */}
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 ${getScoreColor(match.overallScore)}`}>
                      <span className="text-xl font-bold">{match.overallScore}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">AI Score</p>
                  </div>
                </div>

                {/* AI Insights (expanded) */}
                {selectedMatch === match.id && (
                  <div className="mt-4 pt-4 border-t border-clay-border">
                    {/* Recommendation */}
                    <div className="flex items-center gap-2 mb-3">
                      {getRecommendationIcon(match.recommendation)}
                      <span className="font-semibold text-text-primary">
                        {match.recommendation === 'excellent' ? 'Excellent Match!' :
                         match.recommendation === 'good' ? 'Good Match' :
                         match.recommendation === 'fair' ? 'Fair Match' : 'Poor Match'}
                      </span>
                      <span className="text-sm text-text-tertiary">
                        (Confidence: {Math.round(match.confidence * 100)}%)
                      </span>
                    </div>

                    {/* Category Scores */}
                    {match.categoryScores && (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Lifestyle', score: match.categoryScores.lifestyle },
                          { label: 'Numeric', score: match.categoryScores.numeric },
                          { label: 'Preferences', score: match.categoryScores.preference },
                        ].map(cat => (
                          <div key={cat.label} className="text-center p-2 bg-clay-border-light rounded-clay-sm">
                            <div className="text-lg font-bold text-mustard">{cat.score}</div>
                            <div className="text-xs text-text-tertiary">{cat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Strengths */}
                    {match.strengths && match.strengths.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Compatibility Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.strengths.map((s, i) => (
                            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concerns */}
                    {match.concerns && match.concerns.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Potential Concerns
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.concerns.map((c, i) => (
                            <span key={i} className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-end mt-4">
                      {match.bInterested ? (
                        <button
                          className="px-6 py-2 bg-green-100 text-green-700 rounded-clay-sm font-medium cursor-default"
                          disabled
                        >
                          <Heart className="w-4 h-4 inline mr-2 fill-green-700" />
                          Mutual Interest!
                        </button>
                      ) : match.aInterested ? (
                        <span className="text-sm text-text-secondary py-2">
                          Waiting for their response...
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpressInterest(match.id);
                          }}
                          className="px-6 py-2 bg-mustard text-white rounded-clay-sm font-medium hover:bg-mustard/90"
                        >
                          <Heart className="w-4 h-4 inline mr-2" />
                          Express Interest
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-clay-border rounded-clay-sm disabled:opacity-50 hover:border-mustard"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-clay-border rounded-clay-sm disabled:opacity-50 hover:border-mustard"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}


