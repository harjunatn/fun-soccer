import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, Player, Match, Scorer } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  games: Game[];
  addGame: (game: Omit<Game, 'id'>) => Promise<void>;
  updateGame: (id: string, game: Partial<Game>) => Promise<void>;
  getGame: (id: string) => Game | undefined;
  registerPlayer: (gameId: string, teamId: string, player: Omit<Player, 'id' | 'status' | 'registeredAt'>) => Promise<{ success: boolean; error?: string }>;
  updatePlayerStatus: (gameId: string, playerId: string, status: 'confirmed' | 'rejected') => Promise<void>;
  getPendingRegistrations: () => Array<{ game: Game; player: Player }>;
  addGalleryLink: (gameId: string, link: string) => Promise<void>;
  removeGalleryLink: (gameId: string, linkIndex: number) => Promise<void>;
  generateMatches: (gameId: string) => Promise<void>;
  updateMatchResult: (gameId: string, matchId: string, scoreA: number, scoreB: number, scorersA: Scorer[], scorersB: Scorer[]) => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Load games from Supabase
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      
      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .order('date_time', { ascending: true });

      if (gamesError) {
        // If table doesn't exist, set empty array and continue
        if (gamesError.code === '42P01' || gamesError.message?.includes('does not exist')) {
          setGames([]);
          setLoading(false);
          return;
        }
        throw gamesError;
      }
      
      if (!gamesData) {
        setGames([]);
        setLoading(false);
        return;
      }

      // Fetch teams for each game
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*');

      // Fetch players for each team
      const { data: playersData } = await supabase
        .from('players')
        .select('*');

      // Fetch matches for each game
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*');

      // Transform data to match Game interface
      const transformedGames: Game[] = gamesData.map(game => {
        const gameTeams = (teamsData || []).filter(t => t.game_id === game.id);
        const teams = gameTeams.map(team => {
          const teamPlayers = (playersData || []).filter(p => p.team_id === team.id);
          return {
            id: team.id,
            name: team.name,
            players: teamPlayers.map(p => ({
              id: p.id,
              name: p.name,
              contact: p.contact,
              proofFile: p.proof_file,
              status: p.status,
              teamId: p.team_id,
              registeredAt: p.registered_at,
            })),
          };
        });

        const gameMatches = (matchesData || []).filter(m => m.game_id === game.id);

        return {
          id: game.id,
          title: game.title,
          dateTime: game.date_time,
          fieldName: game.field_name,
          address: game.address,
          mapsLink: game.maps_link,
          description: game.description,
          pricePerPlayer: game.price_per_player,
          maxPlayersPerTeam: game.max_players_per_team,
          status: game.status,
          galleryLinks: game.gallery_links || [],
          teams,
          matches: gameMatches.length > 0 ? gameMatches.map(m => ({
            id: m.id,
            teamAId: m.team_a_id,
            teamAName: m.team_a_name,
            teamBId: m.team_b_id,
            teamBName: m.team_b_name,
            scoreA: m.score_a,
            scoreB: m.score_b,
            scorersA: m.scorers_a,
            scorersB: m.scorers_b,
          })) : undefined,
        };
      });

      setGames(transformedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGame = async (game: Omit<Game, 'id'>) => {
    try {
      // Insert game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
          title: game.title,
          date_time: game.dateTime,
          field_name: game.fieldName,
          address: game.address,
          maps_link: game.mapsLink,
          description: game.description,
          price_per_player: game.pricePerPlayer,
          max_players_per_team: game.maxPlayersPerTeam,
          status: game.status,
          gallery_links: game.galleryLinks,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Insert teams
      if (game.teams && game.teams.length > 0) {
        const teamsToInsert = game.teams.map(team => ({
          game_id: gameData.id,
          name: team.name,
        }));

        const { error: teamsError } = await supabase
          .from('teams')
          .insert(teamsToInsert);

        if (teamsError) throw teamsError;
      }

      await loadGames();
    } catch (error) {
      console.error('Error adding game:', error);
      throw error;
    }
  };

  const updateGame = async (id: string, gameUpdate: Partial<Game>) => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (gameUpdate.title) updateData.title = gameUpdate.title;
      if (gameUpdate.dateTime) updateData.date_time = gameUpdate.dateTime;
      if (gameUpdate.fieldName) updateData.field_name = gameUpdate.fieldName;
      if (gameUpdate.address) updateData.address = gameUpdate.address;
      if (gameUpdate.mapsLink) updateData.maps_link = gameUpdate.mapsLink;
      if (gameUpdate.description) updateData.description = gameUpdate.description;
      if (gameUpdate.pricePerPlayer !== undefined) updateData.price_per_player = gameUpdate.pricePerPlayer;
      if (gameUpdate.maxPlayersPerTeam !== undefined) updateData.max_players_per_team = gameUpdate.maxPlayersPerTeam;
      if (gameUpdate.status) updateData.status = gameUpdate.status;
      if (gameUpdate.galleryLinks) updateData.gallery_links = gameUpdate.galleryLinks;

      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update teams if provided
      if (gameUpdate.teams) {
        // Delete existing teams and recreate (simplified approach)
        const { error: deleteError } = await supabase
          .from('teams')
          .delete()
          .eq('game_id', id);

        if (deleteError) throw deleteError;

        const teamsToInsert = gameUpdate.teams.map(team => ({
          game_id: id,
          name: team.name,
        }));

        const { error: insertError } = await supabase
          .from('teams')
          .insert(teamsToInsert)
          .select();

        if (insertError) throw insertError;
      }

      await loadGames();
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  };

  const getGame = (id: string) => {
    return games.find(g => g.id === id);
  };

  const registerPlayer = async (
    gameId: string,
    teamId: string,
    playerData: Omit<Player, 'id' | 'status' | 'registeredAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return { success: false, error: 'Game not found' };

      const team = game.teams.find(t => t.id === teamId);
      if (!team) return { success: false, error: 'Team not found' };

      if (team.players.filter(p => p.status !== 'rejected').length >= game.maxPlayersPerTeam) {
        return { success: false, error: 'Team is full' };
      }

      // Check for existing player
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .eq('contact', playerData.contact)
        .neq('status', 'rejected');

      if (existingPlayers && existingPlayers.length > 0) {
        return { success: false, error: 'You have already registered for this game' };
      }

      const { error } = await supabase
        .from('players')
        .insert({
          team_id: teamId,
          name: playerData.name,
          contact: playerData.contact,
          proof_file: playerData.proofFile,
          status: 'pending',
        });

      if (error) throw error;

      await loadGames();
      return { success: true };
    } catch (error) {
      console.error('Error registering player:', error);
      return { success: false, error: 'Registration failed' };
    }
  };

  const updatePlayerStatus = async (_gameId: string, playerId: string, status: 'confirmed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ status })
        .eq('id', playerId);

      if (error) throw error;

      await loadGames();
    } catch (error) {
      console.error('Error updating player status:', error);
      throw error;
    }
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

  const addGalleryLink = async (gameId: string, link: string) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      const updatedLinks = [...game.galleryLinks, link];

      const { error } = await supabase
        .from('games')
        .update({ gallery_links: updatedLinks })
        .eq('id', gameId);

      if (error) throw error;

      await loadGames();
    } catch (error) {
      console.error('Error adding gallery link:', error);
      throw error;
    }
  };

  const removeGalleryLink = async (gameId: string, linkIndex: number) => {
    try {
      const game = games.find(g => g.id === gameId);
      if (!game) return;

      const updatedLinks = game.galleryLinks.filter((_, i) => i !== linkIndex);

      const { error } = await supabase
        .from('games')
        .update({ gallery_links: updatedLinks })
        .eq('id', gameId);

      if (error) throw error;

      await loadGames();
    } catch (error) {
      console.error('Error removing gallery link:', error);
      throw error;
    }
  };

  const generateMatches = async (gameId: string) => {
    try {
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

      // Delete existing matches for this game
      await supabase
        .from('matches')
        .delete()
        .eq('game_id', gameId);

      // Insert new matches
      const matchesToInsert = generatedMatches.map(match => ({
        game_id: gameId,
        team_a_id: match.teamAId,
        team_a_name: match.teamAName,
        team_b_id: match.teamBId,
        team_b_name: match.teamBName,
      }));

      const { error } = await supabase
        .from('matches')
        .insert(matchesToInsert);

      if (error) throw error;

      await loadGames();
    } catch (error) {
      console.error('Error generating matches:', error);
      throw error;
    }
  };

  const updateMatchResult = async (
    _gameId: string,
    matchId: string,
    scoreA: number,
    scoreB: number,
    scorersA: Scorer[],
    scorersB: Scorer[]
  ) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          score_a: scoreA,
          score_b: scoreB,
          scorers_a: scorersA,
          scorers_b: scorersB,
        })
        .eq('id', matchId);

      if (error) throw error;

      await loadGames();
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
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
        loading,
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