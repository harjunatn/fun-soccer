import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import GameList from './pages/GameList';
import GameDetail from './pages/GameDetail';
import MatchResult from './pages/MatchResult';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import GameForm from './pages/admin/GameForm';
import Verifications from './pages/admin/Verifications';
import MediaEditor from './pages/admin/MediaEditor';
import MatchResultEditor from './pages/admin/MatchResultEditor';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<GameList />} />
            <Route path="/match/:id" element={<GameDetail />} />
            <Route path="/game/:gameId/match/:matchId" element={<MatchResult />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/match/new" element={<GameForm />} />
            <Route path="/admin/match/edit/:id" element={<GameForm />} />
            <Route path="/admin/verifications" element={<Verifications />} />
            <Route path="/admin/media/:id" element={<MediaEditor />} />
            <Route path="/admin/game/:gameId/match/:matchId/result" element={<MatchResultEditor />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
