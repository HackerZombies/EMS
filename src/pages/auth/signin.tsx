// src/pages/auth/signin.tsx

import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import SignInForm from "@/components/signin"; // Or inline the code below

// 1. If user is already authenticated, redirect them away
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (session) {
    // If it's their first time, do something
    if (session.user.isFirstTime) {
      return { redirect: { destination: "/settings/edit", permanent: false } };
    }
    return { redirect: { destination: "/attendance", permanent: false } };
  }
  return { props: {} };
};

export default function SignInPage() {
  return <SignInForm />;
}
