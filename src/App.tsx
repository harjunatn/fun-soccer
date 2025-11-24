import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import MatchList from './pages/MatchList';
import MatchDetail from './pages/MatchDetail';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import MatchForm from './pages/admin/MatchForm';
import Verifications from './pages/admin/Verifications';
import MediaEditor from './pages/admin/MediaEditor';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<MatchList />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/match/new" element={<MatchForm />} />
            <Route path="/admin/match/edit/:id" element={<MatchForm />} />
            <Route path="/admin/verifications" element={<Verifications />} />
            <Route path="/admin/media/:id" element={<MediaEditor />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
