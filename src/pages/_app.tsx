// src/pages/_app.tsx

import Layout from "@/components/layout";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

// 1) Import ToastContainer and its CSS if you still need other toast notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 2) Global styles
import "../styles/globals.css";

// 3) Import ErrorBoundary and FallbackUI
import { ErrorBoundary } from "@/components/ErrorBoundary";
import FallbackUI from "@/components/FallbackUI";

// 4) Import the Notifications component
import Notifications from "@/components/Notifications";

TimeAgo.addLocale(en);

function App({ Component, pageProps }: AppProps) {
  // Remove the existing isAdmin and useNotifications hook call
  // const isAdmin =
  //   pageProps?.session?.user?.role === "ADMIN" ||
  //   pageProps?.session?.user?.role === "HR";

  // useNotifications(isAdmin); // Remove this line

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      {/* Wrap the entire app in the SessionProvider (for next-auth) */}
      <SessionProvider session={pageProps.session}>
        {/* Wrap Layout with ErrorBoundary */}
        <ErrorBoundary fallback={<FallbackUI />}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ErrorBoundary>

        {/* Place the Notifications component, ideally in a layout or header */}
        <Notifications />

        {/* Place the ToastContainer once in your app (if you still need it for other toasts) */}
        <ToastContainer
          position="top-right"
          autoClose={5000} // or any time in ms
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
