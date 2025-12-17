# Project Structure Guidelines

This document outlines the mandatory folder structure for the `bm-gotyaback` application, based on the reference `BM-estore` architecture. All development must adhere to this structure.

## Backend Structure (`backend/src`)

The backend follows a layered architecture pattern:

```
backend/src/
├── config/         # Configuration files (DB, env wrappers, third-party configs)
├── controllers/    # API controllers (req/res handling only)
├── email/          # Email templates and sending logic
├── jobs/           # Scheduled tasks and queues (Cron, Redis queues)
├── middleware/     # Express middleware (Auth, error handling, validation)
├── models/         # Database models (Mongoose schemas)
├── routes/         # API route definitions
├── services/       # Business logic (Heavy lifting, database interactions)
├── test/           # Unit and integration tests
└── utils/          # Shared utility functions and helpers
```

### Key Rules:
- **Controllers** should be thin. They parse input, call a service, and send response.
- **Services** contain business logic. They do not know about HTTP req/res objects.
- **Routes** simply map endpoints to controller methods.

## Frontend Structure (`frontend/src`)

The frontend follows a component-based structure:

```
frontend/src/
├── assets/         # Static assets (images, fonts, global styles)
├── components/     # Reusable UI components (Buttons, Inputs, etc.)
├── constants/      # Global constants, enums, config values
├── hooks/          # Custom React hooks
├── pages/          # Page components (routes point here)
├── routes/         # Router configuration and route definitions
├── services/       # API integration services (Axios calls)
├── test/           # Test setup and utilities
├── types/          # TypeScript type definitions (Interfaces, Types)
└── utils/          # Helper functions
```

### Key Rules:
- **Pages** represent full views/screens.
- **Components** should be reusable and generic where possible.
- **Services** handle all network requests. Components should not call `axios` directly.
- **Types** should be defined in `types/` or co-located if specific to a component.
