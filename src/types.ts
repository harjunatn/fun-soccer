export interface Player {
  id: string;
  name: string;
  contact: string;
  proofFile: {
    name: string;
    type: string;
    url: string;
  };
  status: 'pending' | 'confirmed' | 'rejected';
  teamId: string;
  registeredAt: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface RoundRobinMatch {
  id: string;
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
}

export interface Match {
  id: string;
  title: string;
  dateTime: string;
  fieldName: string;
  address: string;
  mapsLink: string;
  description: string;
  pricePerPlayer: number;
  maxPlayersPerTeam: number;
  teams: Team[];
  status: 'upcoming' | 'completed';
  galleryLinks: string[];
  roundRobinMatches?: RoundRobinMatch[];
}

export interface User {
  email: string;
  isAdmin: boolean;
}
