import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { ExtendedAnnouncement } from "@/types/ExtendedAnnouncement";

interface AnnouncementsGridProps {
  announcements: ExtendedAnnouncement[];
  onPinToggle?: (announcement: ExtendedAnnouncement) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function AnnouncementsGrid({
  announcements,
  onPinToggle,
  onDelete,
  loading,
}: AnnouncementsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {announcements.map((announcement) => {
        // Create a safe text snippet by stripping HTML tags
        const snippetLength = 100;
        const plainText = announcement.text.replace(/<[^>]*>/g, "");
        const snippet =
          plainText.slice(0, snippetLength) +
          (plainText.length >= snippetLength ? "..." : "");
        const safeSnippet = DOMPurify.sanitize(snippet);

        return (
          <Card
            key={announcement.id}
            className="overflow-hidden transition-shadow duration-300 hover:shadow-lg"
          >
            {/* Only render the image section if an image URL exists */}
            {announcement.imageUrl && (
                <div className="relative h-48">
                <Image
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            
            )}

            <CardContent
              className={`p-4 ${
                // If there's no image, add extra minimum height to mimic the image space
                !announcement.imageUrl ? "min-h-[12rem]" : ""
              }`}
            >
              <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                {announcement.title}
              </h2>
              <div
                className={`text-gray-600 mb-4 ${
                  // Optionally allow more lines in the description when no image is present
                  !announcement.imageUrl ? "line-clamp-5" : "line-clamp-3"
                }`}
              >
                {parse(safeSnippet)}
              </div>
              {announcement.pinned && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-200 text-yellow-800 rounded">
                  Pinned
                </span>
              )}
            </CardContent>

            <CardFooter className="bg-gray-50 px-4 py-3 flex items-center justify-between">
              <Link
                href={`/announcements/${announcement.id}`}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
              >
                Read More →
              </Link>

              <div className="flex items-center gap-2">
                {onPinToggle && (
                  <Button
                    variant="outline"
                    className="text-xs"
                    onClick={() => onPinToggle(announcement)}
                    disabled={loading}
                  >
                    {announcement.pinned ? "Unpin" : "Pin"}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    className="text-xs"
                    onClick={() => onDelete(announcement.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
