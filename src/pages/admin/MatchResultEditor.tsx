import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Plus, Minus } from 'lucide-react';
import { Scorer } from '../../types';

export default function MatchResultEditor() {
  const { gameId, matchId } = useParams();
  const navigate = useNavigate();
  const { getGame, updateMatchResult } = useData();
  const { isAdmin } = useAuth();

  const game = getGame(gameId || '');
  const match = game?.matches?.find(m => m.id === matchId);

  const [scoreA, setScoreA] = useState<number>(match?.scoreA || 0);
  const [scoreB, setScoreB] = useState<number>(match?.scoreB || 0);
  const [scorersA, setScorersA] = useState<Scorer[]>(match?.scorersA || []);
  const [scorersB, setScorersB] = useState<Scorer[]>(match?.scorersB || []);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (match) {
      setScoreA(match.scoreA || 0);
      setScoreB(match.scoreB || 0);
      setScorersA(match.scorersA || []);
      setScorersB(match.scorersB || []);
    }
  }, [match]);

  if (!game || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Match not found</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const teamA = game.teams.find(t => t.id === match.teamAId);
  const teamB = game.teams.find(t => t.id === match.teamBId);
  const teamAPlayers = teamA?.players.filter(p => p.status === 'confirmed') || [];
  const teamBPlayers = teamB?.players.filter(p => p.status === 'confirmed') || [];

  const handleAddScorer = (team: 'A' | 'B') => {
    if (team === 'A') {
      setScorersA([...scorersA, { playerId: '', playerName: '', goals: 1 }]);
    } else {
      setScorersB([...scorersB, { playerId: '', playerName: '', goals: 1 }]);
    }
  };

  const handleRemoveScorer = (team: 'A' | 'B', index: number) => {
    if (team === 'A') {
      setScorersA(scorersA.filter((_, i) => i !== index));
    } else {
      setScorersB(scorersB.filter((_, i) => i !== index));
    }
  };

  const handleScorerChange = (team: 'A' | 'B', index: number, field: keyof Scorer, value: string | number) => {
    if (team === 'A') {
      const updated = [...scorersA];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'playerId') {
        const player = teamAPlayers.find(p => p.id === value);
        updated[index].playerName = player?.name || '';
      }
      setScorersA(updated);
    } else {
      const updated = [...scorersB];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'playerId') {
        const player = teamBPlayers.find(p => p.id === value);
        updated[index].playerName = player?.name || '';
      }
      setScorersB(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMatchResult(game.id, match.id, scoreA, scoreB, scorersA, scorersB);
    navigate(`/game/${gameId}/match/${matchId}`);
  };

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
            <h1 className="text-3xl font-bold text-white mb-2">Edit Match Result</h1>
            <p className="text-blue-100">{game.title}</p>
            <p className="text-blue-200 text-lg mt-2">
              {match.teamAName} vs {match.teamBName}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Team A */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{match.teamAName}</h2>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score
                  </label>
                  <input
                    type="number"
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-center"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Scorers
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddScorer('A')}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Scorer
                    </button>
                  </div>
                  <div className="space-y-3">
                    {scorersA.map((scorer, idx) => (
                      <div key={idx} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <select
                          value={scorer.playerId}
                          onChange={(e) => handleScorerChange('A', idx, 'playerId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Player</option>
                          {teamAPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={scorer.goals}
                          onChange={(e) => handleScorerChange('A', idx, 'goals', Number(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                          min="1"
                          placeholder="Goals"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScorer('A', idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {scorersA.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No scorers added yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team B */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{match.teamBName}</h2>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score
                  </label>
                  <input
                    type="number"
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-center"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Scorers
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddScorer('B')}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Scorer
                    </button>
                  </div>
                  <div className="space-y-3">
                    {scorersB.map((scorer, idx) => (
                      <div key={idx} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg">
                        <select
                          value={scorer.playerId}
                          onChange={(e) => handleScorerChange('B', idx, 'playerId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Player</option>
                          {teamBPlayers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={scorer.goals}
                          onChange={(e) => handleScorerChange('B', idx, 'goals', Number(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                          min="1"
                          placeholder="Goals"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScorer('B', idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {scorersB.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No scorers added yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/match/${gameId}`)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Result
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

