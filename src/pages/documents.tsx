import { useState } from "react";
import { Document } from "@prisma/client";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button"; // Import shadcn/ui Button
import Head from "next/head";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; // Import shadcn/ui Card components

type Props = {
  documents: Document[];
};

export default function Documents({ documents }: Props) {
  const [documentList, setDocumentList] = useState(documents);

  const list = {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        when: "afterChildren",
      },
    },
  };

  const item = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "tween" },
    },
    hidden: { opacity: 0, y: 10, filter: "blur(3px)" },
  };

  return (
    <>
      <Head>
        <title>EMS - Documents</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-5">
        <h1 className="text-4xl font-semibold text-gray-900 mb-5">Payslips</h1>
        {documentList.length === 0 ? (
          <div className="flex grow flex-col items-center justify-center gap-2 text-center text-neutral-500">
            <Icon icon="ph:file-text-light" width="8em" className="text-gray-400" />
            <h1 className="text-2xl font-semibold text-gray-900">No Payslip documents</h1>
            <p className="text-neutral-500">
              Check back later to see if any have been uploaded.
            </p>
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            variants={list}
          >
            {documentList.map((document) => (
              <motion.div
                key={document.id}
                className="flex flex-row items-center justify-between gap-4 rounded-2xl bg-white bg-opacity-50 backdrop-blur-sm p-4 text-gray-900 shadow-sm transition-transform transform hover:scale-105 hover:shadow-md border border-gray-200"
                variants={item}
              >
                <Card className="w-full bg-transparent border-none shadow-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      {document.filename}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {new Date(document.dateCreated).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a href={`/api/documents/retrieve?id=${document.id}`}>
                      <Button className="flex items-center justify-center bg-white text-gray-900 rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-transform transform hover:scale-105 border border-gray-200 hover:bg-gray-50">
                        <Icon icon="ph:download" className="mr-2 text-gray-700" />
                        Download
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (session) {
    const documents = await prisma.document.findMany({
      where: {
        userUsername: session.user.username,
      },
      select: {
        id: true,
        filename: true,
        userUsername: true,
        dateCreated: true,
      },
    });

    return { props: { documents } };
  } else {
    return { props: {} };
  }
};