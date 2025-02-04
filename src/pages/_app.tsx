// src/pages/_app.tsx
import Layout from "@/components/layout";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "../styles/globals.css";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import FallbackUI from "@/components/FallbackUI";
// Remove extra NotificationListener import
// import { NotificationListener } from "@/components/NotificationListener";

import { TooltipProvider } from "@/components/ui/tooltip";

TimeAgo.addLocale(en);

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      <SessionProvider session={pageProps.session}>
        <ErrorBoundary fallback={<FallbackUI />}>
          <TooltipProvider>
            <Layout>
              {/* Remove duplicate NotificationListener here */}
              <Component {...pageProps} />
            </Layout>
          </TooltipProvider>
        </ErrorBoundary>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </SessionProvider>
    </>
  );
}

export default App;
