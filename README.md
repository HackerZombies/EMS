# EMS

for testing purposes please use following credentials 
id - 40161
password - Hr@123456789
role - TECHNICIAN 
(can create delete and add new EMployess and can ressolve technical issues and tickets )

id - 29625
password HR123456789
role - HR
(can manage document verification of EMPLOYEES , LEAVE MANAGEMENT , PAYSLIP UPLOAD for specific user , more functionalities )

id - 76495
password - sk123456789
role - Employee
(regular EMPLOYEE , cant access any of the above superadmin features , can apply for leave , create tickets , submit documents , more functionalities check it out yourself )


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
