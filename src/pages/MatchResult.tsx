import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Trophy, User } from 'lucide-react';

export default function MatchResult() {
  const { gameId, matchId } = useParams();
  const navigate = useNavigate();
  const { getGame } = useData();
  const { isAdmin } = useAuth();

  const game = getGame(gameId || '');
  const match = game?.matches?.find(m => m.id === matchId);

  if (!game || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Match not found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const hasResult = match.scoreA !== undefined && match.scoreB !== undefined;
  const winner = hasResult 
    ? (match.scoreA! > match.scoreB! ? match.teamAName : match.scoreB! > match.scoreA! ? match.teamBName : 'Draw')
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/match/${gameId}`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Game
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Match Result</h1>
            <p className="text-blue-100">{game.title}</p>
          </div>

          <div className="p-8">
            {!hasResult ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-800 mb-2">Result Not Available</p>
                <p className="text-gray-600">The match result has not been recorded yet.</p>
                {isAdmin && (
                  <button
                    onClick={() => navigate(`/admin/game/${gameId}/match/${matchId}/result`)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Add Result
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Match Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{match.teamAName}</h2>
                    <span className="text-gray-400 text-xl">vs</span>
                    <h2 className="text-2xl font-bold text-gray-800">{match.teamBName}</h2>
                  </div>
                  {winner && winner !== 'Draw' && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Trophy className="w-5 h-5" />
                      <span className="font-semibold">Winner: {winner}</span>
                    </div>
                  )}
                  {winner === 'Draw' && (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <span className="font-semibold">Draw</span>
                    </div>
                  )}
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Team A */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{match.teamAName}</h3>
                      <div className="text-5xl font-bold text-blue-600">{match.scoreA}</div>
                    </div>

                    {match.scorersA && match.scorersA.length > 0 ? (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Scorers
                        </h4>
                        <div className="space-y-2">
                          {match.scorersA.map((scorer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                            >
                              <span className="text-gray-800 font-medium">{scorer.playerName}</span>
                              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                                {scorer.goals} {scorer.goals === 1 ? 'goal' : 'goals'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>No scorers recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-2 border-red-200">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{match.teamBName}</h3>
                      <div className="text-5xl font-bold text-red-600">{match.scoreB}</div>
                    </div>

                    {match.scorersB && match.scorersB.length > 0 ? (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Scorers
                        </h4>
                        <div className="space-y-2">
                          {match.scorersB.map((scorer, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                            >
                              <span className="text-gray-800 font-medium">{scorer.playerName}</span>
                              <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
                                {scorer.goals} {scorer.goals === 1 ? 'goal' : 'goals'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>No scorers recorded</p>
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <button
                      onClick={() => navigate(`/admin/game/${gameId}/match/${matchId}/result`)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
                    >
                      Edit Result
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

