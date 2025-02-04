// pages/announcements/[id].tsx
import { GetServerSideProps } from "next";
import Head from "next/head";
import { prisma } from "@/lib/prisma";
import { ExtendedAnnouncement } from "@/types/ExtendedAnnouncement";

// ShadCN UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// For date formatting
import { format } from "date-fns";

// A back button component, if you have one
import BackButton from "@/components/BackButton";

interface AnnouncementDetailProps {
  announcement: ExtendedAnnouncement;
}

export default function AnnouncementDetail({
  announcement,
}: AnnouncementDetailProps) {
  const formattedDate = format(new Date(announcement.dateCreated), "PPpp");

  return (
    <>
      <Head>
        <title>{announcement.title} | Announcement Details</title>
      </Head>

      <div className="min-h-screen w-full flex flex-col">
        {/* Top toolbar/back button */}
        <div className="p-4">
          <BackButton />
        </div>

        {/* Main content area */}
        <div className="flex-1 p-4">
          <Card className="h-full w-full shadow-lg border rounded-lg overflow-hidden flex flex-col">
            {/* Card Header */}
            <CardHeader className="px-6 py-4 bg-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-800 mb-1">
                    {announcement.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {formattedDate}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.pinned && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-200 text-yellow-800"
                    >
                      Pinned
                    </Badge>
                  )}
                  {announcement.archived && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-200 text-gray-800"
                    >
                      Archived
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Image Section */}
            {announcement.imageUrl && (
              <div className="w-full flex items-center justify-center bg-gray-100 p-4">
                <img
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  className="max-w-full h-auto object-contain rounded-lg"
                />
              </div>
            )}

            {/* Text Content */}
            <CardContent className="px-6 py-4 bg-white flex-1 overflow-auto">
              <div className="prose max-w-none text-gray-800">
                {/*  
                  IMPORTANT: If announcement.text contains user-generated HTML,
                  make sure to sanitize it to avoid XSS vulnerabilities.
                */}
                <div dangerouslySetInnerHTML={{ __html: announcement.text }} />
              </div>
            </CardContent>

            {/* Footer */}
            <CardFooter className="px-6 py-4 bg-white flex items-center justify-between">
              {announcement.roleTargets && announcement.roleTargets.length > 0 && (
                <div className="text-sm text-gray-500">
                  Target: {announcement.roleTargets.join(", ")}
                </div>
              )}
              <Button variant="default" onClick={() => window.history.back()}>
                Back
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;

  // Redirect if no valid id provided
  if (!id || Array.isArray(id)) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id },
  });

  // If the announcement is not found, redirect to home page
  if (!announcement) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      announcement: JSON.parse(JSON.stringify(announcement)),
    },
  };
};
