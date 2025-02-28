# EMS




## Features

- Creating and viewing announcements
- Tracking leave requests
- Managing HR documents
- Ticket system for user support
- User management
- Home page with notifications of all changes

## Getting Started

If you don't have it already, [install Node.js](https://nodejs.org/en).
To install all dependencies for the app:

```bash
npm install
```

Then, create the database:

```bash
npx prisma migrate dev --name init
```

Now, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
