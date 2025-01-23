// types/nextauth.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    isFirstTime: boolean;
    image?: string; // Optional field for profile picture
  }
  

  interface Session {
    user: User;
  }
}
