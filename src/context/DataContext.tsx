import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, Player, Match, Scorer } from '../types';

interface DataContextType {
  games: Game[];
  addGame: (game: Omit<Game, 'id'>) => void;
  updateGame: (id: string, game: Partial<Game>) => void;
  getGame: (id: string) => Game | undefined;
  registerPlayer: (gameId: string, teamId: string, player: Omit<Player, 'id' | 'status' | 'registeredAt'>) => { success: boolean; error?: string };
  updatePlayerStatus: (gameId: string, playerId: string, status: 'confirmed' | 'rejected') => void;
  getPendingRegistrations: () => Array<{ game: Game; player: Player }>;
  addGalleryLink: (gameId: string, link: string) => void;
  removeGalleryLink: (gameId: string, linkIndex: number) => void;
  generateMatches: (gameId: string) => void;
  updateMatchResult: (gameId: string, matchId: string, scoreA: number, scoreB: number, scorersA: Scorer[], scorersB: Scorer[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'medy_games_data';

const seedData: Game[] = [
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
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setGames(JSON.parse(stored));
    } else {
      setGames(seedData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    }
  }, []);

  const saveGames = (newGames: Game[]) => {
    setGames(newGames);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGames));
  };

  const addGame = (game: Omit<Game, 'id'>) => {
    const newGame: Game = {
      ...game,
      id: Date.now().toString(),
    };
    saveGames([...games, newGame]);
  };

  const updateGame = (id: string, gameUpdate: Partial<Game>) => {
    const updated = games.map(g => g.id === id ? { ...g, ...gameUpdate } : g);
    saveGames(updated);
  };

  const getGame = (id: string) => {
    return games.find(g => g.id === id);
  };

  const registerPlayer = (
    gameId: string,
    teamId: string,
    playerData: Omit<Player, 'id' | 'status' | 'registeredAt'>
  ): { success: boolean; error?: string } => {
    const game = games.find(g => g.id === gameId);
    if (!game) return { success: false, error: 'Game not found' };

    const team = game.teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    if (team.players.filter(p => p.status !== 'rejected').length >= game.maxPlayersPerTeam) {
      return { success: false, error: 'Team is full' };
    }

    const existingPlayer = game.teams
      .flatMap(t => t.players)
      .find(p => p.contact === playerData.contact && p.status !== 'rejected');

    if (existingPlayer) {
      return { success: false, error: 'You have already registered for this game' };
    }

    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString(),
      status: 'pending',
      registeredAt: new Date().toISOString(),
    };

    const updatedGames = games.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          teams: g.teams.map(t => {
            if (t.id === teamId) {
              return { ...t, players: [...t.players, newPlayer] };
            }
            return t;
          }),
        };
      }
      return g;
    });

    saveGames(updatedGames);
    return { success: true };
  };

  const updatePlayerStatus = (gameId: string, playerId: string, status: 'confirmed' | 'rejected') => {
    const updatedGames = games.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          teams: g.teams.map(t => ({
            ...t,
            players: t.players.map(p =>
              p.id === playerId ? { ...p, status } : p
            ),
          })),
        };
      }
      return g;
    });
    saveGames(updatedGames);
  };

  const getPendingRegistrations = () => {
    const pending: Array<{ game: Game; player: Player }> = [];
    games.forEach(game => {
      game.teams.forEach(team => {
        team.players.forEach(player => {
          if (player.status === 'pending') {
            pending.push({ game, player });
          }
        });
      });
    });
    return pending;
  };

  const addGalleryLink = (gameId: string, link: string) => {
    const updatedGames = games.map(g => {
      if (g.id === gameId) {
        return { ...g, galleryLinks: [...g.galleryLinks, link] };
      }
      return g;
    });
    saveGames(updatedGames);
  };

  const removeGalleryLink = (gameId: string, linkIndex: number) => {
    const updatedGames = games.map(g => {
      if (g.id === gameId) {
        return { ...g, galleryLinks: g.galleryLinks.filter((_, i) => i !== linkIndex) };
      }
      return g;
    });
    saveGames(updatedGames);
  };

  const generateMatches = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (!game || game.teams.length < 2) {
      return;
    }

    const generatedMatches: Match[] = [];
    const teams = game.teams;
    const baseTimestamp = Date.now();
    let matchCounter = 0;

    // Generate all possible pairings (round-robin)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        generatedMatches.push({
          id: `match-${baseTimestamp}-${matchCounter++}`,
          teamAId: teams[i].id,
          teamAName: teams[i].name,
          teamBId: teams[j].id,
          teamBName: teams[j].name,
        });
      }
    }

    // Shuffle the matches randomly
    for (let i = generatedMatches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generatedMatches[i], generatedMatches[j]] = [generatedMatches[j], generatedMatches[i]];
    }

    const updatedGames = games.map(g => {
      if (g.id === gameId) {
        return { ...g, matches: generatedMatches };
      }
      return g;
    });
    saveGames(updatedGames);
  };

  const updateMatchResult = (
    gameId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
    scorersA: Scorer[],
    scorersB: Scorer[]
  ) => {
    const updatedGames = games.map(g => {
      if (g.id === gameId && g.matches) {
        return {
          ...g,
          matches: g.matches.map(m => {
            if (m.id === matchId) {
              return {
                ...m,
                scoreA,
                scoreB,
                scorersA,
                scorersB,
              };
            }
            return m;
          }),
        };
      }
      return g;
    });
    saveGames(updatedGames);
  };

  return (
    <DataContext.Provider
      value={{
        games,
        addGame,
        updateGame,
        getGame,
        registerPlayer,
        updatePlayerStatus,
        getPendingRegistrations,
        addGalleryLink,
        removeGalleryLink,
        generateMatches,
        updateMatchResult,
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
