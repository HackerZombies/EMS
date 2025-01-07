// pages/_error.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import type { NextPage } from 'next';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { NextApiResponse } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { PreviewData } from 'next/types';
import { NextApiRequest } from 'next';

interface ErrorProps {
  statusCode: number;
}

const ErrorPage: NextPage<ErrorProps> = ({ statusCode }) => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (statusCode === 404 && status === 'authenticated') {
      // Sign out the user immediately
      signOut({ callbackUrl: '/auth/signin' });
    } else if (statusCode !== 404 && status === 'unauthenticated') {
      // If it's not a 404 and the user is unauthenticated, redirect to signin
      router.push('/auth/signin');
    }
  }, [statusCode, status, router]);

  // Render a minimal error message or nothing
  return statusCode === 404 ? (
    <div>
      {/* Optionally display a brief message before redirecting */}
      <p>Page not found. You are being signed out.</p>
    </div>
  ) : (
    <div>
      <h1>An error occurred</h1>
      <p>Status Code: {statusCode}</p>
    </div>
  );
};

// Use getServerSideProps to fetch statusCode
export const getServerSideProps: GetServerSideProps<ErrorProps> = async (context: GetServerSidePropsContext) => {
  const { res, req } = context;
  const statusCode = res?.statusCode || (req as NextApiRequest & { statusCode?: number }).statusCode || 404;
  return { props: { statusCode } };
};

export default ErrorPage;