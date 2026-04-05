# SmartFleet Manager

A comprehensive fleet management system designed to streamline vehicle tracking, maintenance scheduling, fuel monitoring, and operational reporting for businesses managing vehicle fleets.

## Features

- **Vehicle Management**: Track and manage your entire fleet with detailed vehicle information, including specifications, registration, and status.
- **Maintenance Scheduling**: Schedule and track maintenance tasks, work orders, and service history for each vehicle.
- **Fuel Monitoring**: Monitor fuel transactions, consumption patterns, and costs across your fleet.
- **Work Orders**: Create and manage work orders for repairs, inspections, and other vehicle-related tasks.
- **Reports**: Generate detailed reports on distance deviations, maintenance history, and fleet performance.
- **Dashboard**: Real-time overview of fleet status, alerts, and key metrics.
- **Backup & Recovery**: Automated daily backups and manual backup functionality to ensure data safety.
- **Geocoding**: Integrate location services for route planning and tracking.
- **Spare Parts & Tires**: Manage inventory of spare parts and tire replacements.

## Technology Stack

- **Frontend**: Next.js with React and TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Backend**: Next.js API routes
- **Database**: Prisma ORM with SQLite/PostgreSQL support
- **Desktop App**: Electron for cross-platform desktop application
- **Build Tools**: Electron Builder for packaging

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SQLite or PostgreSQL (configured in Prisma schema)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smartfleet-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. (Optional) Run database migrations:
   ```bash
   npm run db:migrate
   ```

## Usage

### Development

- Start the Next.js development server:
  ```bash
  npm run dev
  ```

- Start the Electron app in development mode:
  ```bash
  npm run electron:dev
  ```

### Production

- Build the application:
  ```bash
  npm run build
  ```

- Start the production server:
  ```bash
  npm start
  ```

- Build the Electron app:
  ```bash
  npm run electron:build
  ```

- Build the full Electron installer:
  ```bash
  npm run electron:build:full
  ```

## Database

The application uses Prisma as the ORM. The database schema is defined in `prisma/schema.prisma`.

- Push schema changes: `npm run db:push`
- Generate Prisma client: `npm run db:generate`
- Create migrations: `npm run db:migrate`
- Reset database: `npm run db:reset`

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run electron`: Run Electron app
- `npm run electron:dev`: Run Electron in development mode
- `npm run electron:build`: Build Electron app (directory)
- `npm run electron:build:full`: Build full Electron installer
- `npm run lint`: Run ESLint
- `npm run db:push`: Push database schema
- `npm run db:generate`: Generate Prisma client
- `npm run db:migrate`: Run database migrations
- `npm run db:reset`: Reset database

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
electron/                   # Electron main process files
prisma/                     # Database schema and migrations
public/                     # Static assets
scripts/                    # Utility scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Version

Current version: 6.1.0

## Support

For support or questions, please contact the development team.