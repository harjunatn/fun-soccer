import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Match, Player, RoundRobinMatch } from '../types';

interface DataContextType {
  matches: Match[];
  addMatch: (match: Omit<Match, 'id'>) => void;
  updateMatch: (id: string, match: Partial<Match>) => void;
  getMatch: (id: string) => Match | undefined;
  registerPlayer: (matchId: string, teamId: string, player: Omit<Player, 'id' | 'status' | 'registeredAt'>) => { success: boolean; error?: string };
  updatePlayerStatus: (matchId: string, playerId: string, status: 'confirmed' | 'rejected') => void;
  getPendingRegistrations: () => Array<{ match: Match; player: Player }>;
  addGalleryLink: (matchId: string, link: string) => void;
  generateRoundRobinMatches: (matchId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'medy_matches_data';

const seedData: Match[] = [
  {
    id: '1',
    title: 'Koci Soccer Field',
    dateTime: '2025-11-21T20:00',
    fieldName: 'Koci Soccer Field',
    address: 'Jl. Margonda Raya, Kemiri Muka, Kecamatan Beji, Kota Depok, Jawa Barat 16423',
    mapsLink: 'https://maps.app.goo.gl/JLZis9rzoErETo9R8',
    description: 'Join us for an exciting weekend match! Open for all skill levels.',
    pricePerPlayer: 100000,
    maxPlayersPerTeam: 11,
    status: 'upcoming',
    galleryLinks: [],
    teams: [
      {
        id: 'team-red',
        name: 'Team Merah',
        players: [
          {
            id: 'p1',
            name: 'Medy Renaldy',
            contact: '081234567890',
            proofFile: { name: 'payment.jpg', type: 'image/jpeg', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E' },
            status: 'confirmed',
            teamId: 'team-red',
            registeredAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'p2',
            name: 'Harjuna Tri Nugroho',
            contact: '081234567891',
            proofFile: { name: 'payment.jpg', type: 'image/jpeg', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E' },
            status: 'confirmed',
            teamId: 'team-red',
            registeredAt: new Date(Date.now() - 82800000).toISOString(),
          },
        ],
      },
      {
        id: 'team-blue',
        name: 'Team Biru',
        players: [
          {
            id: 'p3',
            name: 'Cahyo Wibowo',
            contact: '081234567892',
            proofFile: { name: 'payment.jpg', type: 'image/jpeg', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E' },
            status: 'pending',
            teamId: 'team-blue',
            registeredAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      },
      {
        id: 'team-yellow',
        name: 'Team Kuning',
        players: [],
      },
      {
        id: 'team-green',
        name: 'Team Hijau',
        players: [],
      },
    ],
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setMatches(JSON.parse(stored));
    } else {
      setMatches(seedData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    }
  }, []);

  const saveMatches = (newMatches: Match[]) => {
    setMatches(newMatches);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMatches));
  };

  const addMatch = (match: Omit<Match, 'id'>) => {
    const newMatch: Match = {
      ...match,
      id: Date.now().toString(),
    };
    saveMatches([...matches, newMatch]);
  };

  const updateMatch = (id: string, matchUpdate: Partial<Match>) => {
    const updated = matches.map(m => m.id === id ? { ...m, ...matchUpdate } : m);
    saveMatches(updated);
  };

  const getMatch = (id: string) => {
    return matches.find(m => m.id === id);
  };

  const registerPlayer = (
    matchId: string,
    teamId: string,
    playerData: Omit<Player, 'id' | 'status' | 'registeredAt'>
  ): { success: boolean; error?: string } => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return { success: false, error: 'Match not found' };

    const team = match.teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    if (team.players.filter(p => p.status !== 'rejected').length >= match.maxPlayersPerTeam) {
      return { success: false, error: 'Team is full' };
    }

    const existingPlayer = match.teams
      .flatMap(t => t.players)
      .find(p => p.contact === playerData.contact && p.status !== 'rejected');

    if (existingPlayer) {
      return { success: false, error: 'You have already registered for this match' };
    }

    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
      status: 'pending',
      registeredAt: new Date().toISOString(),
    };

    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          teams: m.teams.map(t => {
            if (t.id === teamId) {
              return { ...t, players: [...t.players, newPlayer] };
            }
            return t;
          }),
        };
      }
      return m;
    });

    saveMatches(updatedMatches);
    return { success: true };
  };

  const updatePlayerStatus = (matchId: string, playerId: string, status: 'confirmed' | 'rejected') => {
    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          teams: m.teams.map(t => ({
            ...t,
            players: t.players.map(p =>
              p.id === playerId ? { ...p, status } : p
            ),
          })),
        };
      }
      return m;
    });
    saveMatches(updatedMatches);
  };

  const getPendingRegistrations = () => {
    const pending: Array<{ match: Match; player: Player }> = [];
    matches.forEach(match => {
      match.teams.forEach(team => {
        team.players.forEach(player => {
          if (player.status === 'pending') {
            pending.push({ match, player });
          }
        });
      });
    });
    return pending;
  };

  const addGalleryLink = (matchId: string, link: string) => {
    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return { ...m, galleryLinks: [...m.galleryLinks, link] };
      }
      return m;
    });
    saveMatches(updatedMatches);
  };

  const generateRoundRobinMatches = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.teams.length < 2) {
      return;
    }

    const roundRobinMatches: RoundRobinMatch[] = [];
    const teams = match.teams;
    const baseTimestamp = Date.now();
    let matchCounter = 0;

    // Generate all possible pairings (round-robin)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        roundRobinMatches.push({
          id: `rr-${baseTimestamp}-${matchCounter++}`,
          teamAId: teams[i].id,
          teamAName: teams[i].name,
          teamBId: teams[j].id,
          teamBName: teams[j].name,
        });
      }
    }

    // Shuffle the matches randomly
    for (let i = roundRobinMatches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roundRobinMatches[i], roundRobinMatches[j]] = [roundRobinMatches[j], roundRobinMatches[i]];
    }

    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return { ...m, roundRobinMatches };
      }
      return m;
    });
    saveMatches(updatedMatches);
  };

  return (
    <DataContext.Provider
      value={{
        matches,
        addMatch,
        updateMatch,
        getMatch,
        registerPlayer,
        updatePlayerStatus,
        getPendingRegistrations,
        addGalleryLink,
        generateRoundRobinMatches,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
