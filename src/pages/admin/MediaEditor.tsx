import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';

export default function MediaEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMatch, addGalleryLink } = useData();
  const { isAdmin } = useAuth();

  const match = getMatch(id || '');
  const [newLink, setNewLink] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, navigate]);

  if (!match) {
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

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      new URL(newLink);
      addGalleryLink(match.id, newLink);
      setNewLink('');
    } catch {
      setError('Please enter a valid URL');
    }
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

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Match Media Gallery</h1>
            <p className="text-blue-100">{match.title}</p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add Media Link</h2>
              <form onSubmit={handleAddLink} className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://photos.google.com/... or https://youtube.com/..."
                    required
                  />
                  {error && (
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Link
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Current Media Links ({match.galleryLinks.length})
              </h2>

              {match.galleryLinks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <LinkIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600">No media links added yet</p>
                  <p className="text-sm text-gray-500 mt-1">Add photo or video gallery links above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {match.galleryLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 truncate"
                        >
                          {link}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          const updatedLinks = match.galleryLinks.filter((_, i) => i !== idx);
                          addGalleryLink(match.id, '');
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove link"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={() => navigate(`/match/${match.id}`)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                View Match Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
