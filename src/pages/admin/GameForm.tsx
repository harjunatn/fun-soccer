import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

export default function GameForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addGame, updateGame, getGame } = useData();
  const { isAdmin } = useAuth();

  const isEdit = !!id;
  const existingGame = isEdit ? getGame(id) : null;

  const [formData, setFormData] = useState({
    title: '',
    dateTime: '',
    fieldName: '',
    address: '',
    mapsLink: '',
    description: '',
    pricePerPlayer: 50000,
    maxPlayersPerTeam: 11,
    status: 'upcoming' as 'upcoming' | 'completed',
    teamNames: ['Team Merah', 'Team Biru', 'Team Kuning', 'Team Hijau'],
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (existingGame) {
      setFormData({
        title: existingGame.title,
        dateTime: existingGame.dateTime,
        fieldName: existingGame.fieldName,
        address: existingGame.address,
        mapsLink: existingGame.mapsLink,
        description: existingGame.description,
        pricePerPlayer: existingGame.pricePerPlayer,
        maxPlayersPerTeam: existingGame.maxPlayersPerTeam,
        status: existingGame.status,
        teamNames: existingGame.teams.map(t => t.name),
      });
    }
  }, [existingGame]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const gameData = {
      title: formData.title,
      dateTime: formData.dateTime,
      fieldName: formData.fieldName,
      address: formData.address,
      mapsLink: formData.mapsLink,
      description: formData.description,
      pricePerPlayer: formData.pricePerPlayer,
      maxPlayersPerTeam: formData.maxPlayersPerTeam,
      status: formData.status,
      galleryLinks: existingGame?.galleryLinks || [],
      teams: formData.teamNames.map((name, idx) => ({
        id: existingGame?.teams[idx]?.id || `team-${idx + 1}`,
        name,
        players: existingGame?.teams[idx]?.players || [],
      })),
    };

    if (isEdit && existingGame) {
      updateGame(existingGame.id, gameData);
    } else {
      addGame(gameData);
    }

    navigate('/admin/dashboard');
  };

  const handleTeamNameChange = (index: number, value: string) => {
    const newTeamNames = [...formData.teamNames];
    newTeamNames[index] = value;
    setFormData({ ...formData, teamNames: newTeamNames });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {isEdit ? 'Edit Game' : 'Create New Game'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Weekend Soccer Match"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lapangan Medy Central"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jl. Olahraga No. 15, Jakarta"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Maps Link *
              </label>
              <input
                type="url"
                value={formData.mapsLink}
                onChange={(e) => setFormData({ ...formData, mapsLink: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://maps.google.com/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Describe the game..."
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Player (Rp) *
                </label>
                <input
                  type="number"
                  value={formData.pricePerPlayer}
                  onChange={(e) => setFormData({ ...formData, pricePerPlayer: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Players per Team *
                </label>
                <input
                  type="number"
                  value={formData.maxPlayersPerTeam}
                  onChange={(e) => setFormData({ ...formData, maxPlayersPerTeam: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'upcoming' | 'completed' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Team Names *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {formData.teamNames.map((name, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={name}
                    onChange={(e) => handleTeamNameChange(idx, e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Team ${idx + 1}`}
                    required
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isEdit ? 'Update Game' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

