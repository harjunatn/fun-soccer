# Medyrenaldy Fun Soccer

An interactive React web application for managing soccer matches and player registrations. This MVP prototype simulates match management, player registration, and admin verification flows with local storage persistence.

## Features

### For Guests/Players
- View available matches with details (date, location, price, team status)
- Register for matches by choosing a team
- Upload payment proof (image or PDF)
- View registration status (pending/confirmed/rejected)
- View match galleries after completion

### For Administrators
- Secure admin login
- Create and edit matches
- Configure 4 teams per match with customizable names
- Set maximum players per team (default: 11)
- View dashboard with statistics
- Verify pending registrations (approve/reject)
- Attach gallery links (photos/videos) to completed matches

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Local Storage** for data persistence

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   └── RegistrationModal.tsx
├── context/           # React context providers
│   ├── AuthContext.tsx
│   └── DataContext.tsx
├── pages/             # Page components
│   ├── Login.tsx
│   ├── MatchList.tsx
│   ├── MatchDetail.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── MatchForm.tsx
│       ├── Verifications.tsx
│       └── MediaEditor.tsx
├── types.ts           # TypeScript type definitions
├── App.tsx            # Main app with routing
└── main.tsx           # Entry point
```

## Default Admin Credentials

- **Email:** admin@medy.local
- **Password:** Admin123!

## Sample Data

The application comes pre-seeded with:
- 1 upcoming match titled "Weekend Soccer Match"
- 4 teams (Merah, Biru, Kuning, Hijau)
- 2 confirmed players and 1 pending registration

## Features & Validations

### Registration
- File upload limited to JPG, PNG, and PDF (max 5MB)
- Prevents duplicate registrations (same contact in same match)
- Prevents registration when team is full
- Shows preview for uploaded images
- Displays file name for PDF uploads

### Match Management
- Editable team names (4 teams by default)
- Configurable max players per team
- Date/time selection
- Google Maps integration
- Match status (upcoming/completed)
- Price per player configuration

### Security
- Admin authentication with local storage
- Protected admin routes
- Session persistence across page reloads

## Color Scheme

- **Primary Blue:** #0B6EF6 (buttons, headers, links)
- **Accent Yellow:** #FFD24C (action buttons, highlights)
- **Neutral Grays:** For backgrounds and text

## Browser Support

Modern browsers with ES6+ support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This is an MVP prototype for demonstration purposes.
