// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
  }

  interface Session {
    user: {
      username: string;
      role: string;
      firstName: string;
      lastName: string;
      department?: string;
      position?: string;
    };
  }
}