// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        {/* You could also do <style> or Tailwind classes here if you prefer */}
        <style>{`
          html, body {
            background-color: transparent !important;
            margin: 0; 
            padding: 0;
          }
        `}</style>
      </Head>
      <body className="bg-transparent">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
