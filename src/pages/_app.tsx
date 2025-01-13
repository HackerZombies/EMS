// src/pages/_app.tsx

import Layout from "@/components/layout";
import { SessionProvider } from "next-auth/react";
import { AppProps } from "next/app";
import Head from "next/head";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

// 1) Import ToastContainer and its CSS
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 2) Global styles
import "../styles/globals.css";

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
        <Layout>
          <Component {...pageProps} />
        </Layout>

        {/* 3) Place the ToastContainer once in your app (usually at the root) */}
        <ToastContainer
          position="top-right"
          autoClose={5000}    // or any time in ms
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
