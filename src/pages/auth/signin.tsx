// src/pages/auth/signin.tsx

import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import SignIn from "@/components/signin";

export default function SignInPage() {
  return <SignIn />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    if (session.user.isFirstTime) {
      return {
        redirect: {
          destination: "/settings/edit",
          permanent: false,
        },
      };
    }
    // Redirect to dashboard or homepage if not first-time user
    return {
      redirect: {
        destination: "/attendance", // Adjust as needed
        permanent: false,
      },
    };
  }

  return {
    props: {}, // No props needed for sign-in page
  };
};
