import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Verifications() {
  const navigate = useNavigate();
  const { getPendingRegistrations, updatePlayerStatus } = useData();
  const { isAdmin, loading: authLoading } = useAuth();
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const pendingRegistrations = getPendingRegistrations();

  const handleApprove = async (gameId: string, playerId: string) => {
    setUpdatingPlayers(prev => new Set(prev).add(playerId));
    try {
      await updatePlayerStatus(gameId, playerId, 'confirmed');
    } catch (error) {
      console.error('Error approving player:', error);
      alert('Failed to approve player. Please try again.');
    } finally {
      setUpdatingPlayers(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const handleReject = async (gameId: string, playerId: string) => {
    setUpdatingPlayers(prev => new Set(prev).add(playerId));
    try {
      await updatePlayerStatus(gameId, playerId, 'rejected');
    } catch (error) {
      console.error('Error rejecting player:', error);
      alert('Failed to reject player. Please try again.');
    } finally {
      setUpdatingPlayers(prev => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Pending Verifications</h1>
            <p className="text-gray-800 mt-1">
              {pendingRegistrations.length} registration{pendingRegistrations.length !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>

          <div className="p-8">
            {pendingRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-xl font-semibold text-gray-800 mb-2">All caught up!</p>
                <p className="text-gray-600">No pending registrations to verify</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingRegistrations.map(({ game, player }) => {
                  const team = game.teams.find(t => t.id === player.teamId);
                  return (
                    <div
                      key={player.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-shrink-0">
                          {player.proofFile.type.startsWith('image/') ? (
                            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-100">
                              {imageErrors.has(player.id) ? (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500">Image failed to load</p>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={player.proofFile.url}
                                  alt="Payment proof"
                                  className="w-full h-full object-cover"
                                  onError={() => setImageErrors(prev => new Set(prev).add(player.id))}
                                  loading="lazy"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                              <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto text-red-500 mb-2" />
                                <p className="text-sm text-gray-600">PDF File</p>
                              </div>
                            </div>
                          )}
                          <a
                            href={player.proofFile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                          >
                            {player.proofFile.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            View Full File
                          </a>
                        </div>

                        <div className="flex-1">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{player.name}</h3>
                            <p className="text-gray-600">{player.contact}</p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Game:</span>
                              <span className="text-sm text-gray-600">{game.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Team:</span>
                              <span className="text-sm text-gray-600">{team?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Date:</span>
                              <span className="text-sm text-gray-600">{formatDate(game.dateTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">Registered:</span>
                              <span className="text-sm text-gray-600">
                                {formatDate(player.registeredAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApprove(game.id, player.id)}
                              disabled={updatingPlayers.has(player.id)}
                              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle className="w-5 h-5" />
                              {updatingPlayers.has(player.id) ? 'Updating...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(game.id, player.id)}
                              disabled={updatingPlayers.has(player.id)}
                              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle className="w-5 h-5" />
                              {updatingPlayers.has(player.id) ? 'Updating...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
