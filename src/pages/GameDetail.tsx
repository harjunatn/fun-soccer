import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, DollarSign, Users, ArrowLeft, ExternalLink, CheckCircle, Clock, XCircle, Play } from 'lucide-react';
import RegistrationModal from '../components/RegistrationModal';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getGame, registerPlayer, generateMatches } = useData();
  const { isAdmin } = useAuth();
  const game = getGame(id || '');

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Game not found</h2>
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

  const formatDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleJoinClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setIsModalOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleRegistration = (data: { name: string; contact: string; proofFile: { name: string; type: string; url: string } }) => {
    const result = registerPlayer(game.id, selectedTeamId, {
      name: data.name,
      contact: data.contact,
      proofFile: data.proofFile,
      teamId: selectedTeamId,
    });

    setIsModalOpen(false);

    if (result.success) {
      setSuccessMessage('Registration submitted successfully! Please wait for admin verification.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrorMessage(result.error || 'Registration failed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const selectedTeam = game.teams.find(t => t.id === selectedTeamId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{game.title}</h1>
                <div className="flex flex-wrap gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{formatDate(game.dateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{game.fieldName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Rp {game.pricePerPlayer.toLocaleString('id-ID')}/player</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Game Details</h2>
              <p className="text-gray-600 leading-relaxed">{game.description}</p>
              <div className="mt-4 flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-gray-700 font-medium">{game.address}</p>
                  <a
                    href={game.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mt-1"
                  >
                    Open in Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">Teams</h2>
                </div>
                {isAdmin && game.teams.length >= 2 && (
                  <button
                    onClick={() => generateMatches(game.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Start the Game
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {game.teams.map(team => {
                  const confirmedPlayers = team.players.filter(p => p.status !== 'rejected');
                  const isFull = confirmedPlayers.length >= game.maxPlayersPerTeam;

                  return (
                    <div
                      key={team.id}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{team.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {confirmedPlayers.length}/{game.maxPlayersPerTeam}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4 min-h-[120px]">
                        {team.players.length === 0 && (
                          <p className="text-sm text-gray-500 italic">No players yet</p>
                        )}
                        {team.players.map((player, idx) => (
                          <div key={player.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {idx + 1}. {player.name}
                            </span>
                            {getStatusBadge(player.status)}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleJoinClick(team.id)}
                        disabled={isFull}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                          isFull
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        }`}
                      >
                        {isFull ? 'Team Full' : 'Join Team'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {game.matches && game.matches.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Matches</h2>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                  <div className="space-y-3">
                    {game.matches.map((match, idx) => {
                      const hasResult = match.scoreA !== undefined && match.scoreB !== undefined;
                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-gray-500 font-medium w-8">{idx + 1}.</span>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-semibold text-gray-800">{match.teamAName}</span>
                              {hasResult ? (
                                <span className="text-lg font-bold text-gray-800">
                                  {match.scoreA} - {match.scoreB}
                                </span>
                              ) : (
                                <span className="text-gray-400">vs</span>
                              )}
                              <span className="font-semibold text-gray-800">{match.teamBName}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {hasResult && (
                              <button
                                onClick={() => navigate(`/game/${game.id}/match/${match.id}`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                              >
                                View Result
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => navigate(`/admin/game/${game.id}/match/${match.id}/result`)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
                              >
                                {hasResult ? 'Edit' : 'Add Result'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {game.galleryLinks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Gallery</h2>
                <div className="flex flex-wrap gap-3">
                  {game.galleryLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      View {link.includes('photo') || link.includes('image') ? 'Photos' : 'Media'} {idx + 1}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamName={selectedTeam?.name || ''}
        onSubmit={handleRegistration}
      />
    </div>
  );
}

