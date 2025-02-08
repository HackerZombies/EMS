import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import parse from "html-react-parser"
import DOMPurify from "dompurify"
import { ExtendedAnnouncement } from "@/types/ExtendedAnnouncement"
import { Badge } from "@/components/ui/badge"

// Helper function to format date/time
function formatDate(date: string | Date) {
  // Adjust locale/options as needed
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

interface AnnouncementsGridProps {
  announcements: ExtendedAnnouncement[]
  onPinToggle?: (announcement: ExtendedAnnouncement) => void
  onDelete?: (id: string) => void
  loading?: boolean
}

export function AnnouncementsGrid({
  announcements,
  onPinToggle,
  onDelete,
  loading,
}: AnnouncementsGridProps) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 mt-3">
      {announcements.map((announcement) => {
        // Create a safe text snippet by stripping HTML tags
        const snippetLength = 120
        const plainText = announcement.text.replace(/<[^>]*>/g, "")
        const snippet =
          plainText.slice(0, snippetLength) +
          (plainText.length >= snippetLength ? "..." : "")
        const safeSnippet = DOMPurify.sanitize(snippet)

        // Format the announcement date/time
        const formattedDate = formatDate(announcement.dateCreated)

        return (
          <div
            key={announcement.id}
            className="mb-3 break-inside-avoid-column transition-shadow hover:shadow-lg"
          >
            <Card className="bg-white text-gray-800 border border-gray-200 rounded-md">
              {/* Show image if announcement.imageUrl is available */}
              {announcement.imageUrl && (
                <div className="relative w-full h-40 sm:h-44 md:h-48 overflow-hidden rounded-t-md">
                  <Image
                    src={announcement.imageUrl}
                    alt={announcement.title}
                    fill
                    sizes="(max-width: 768px) 100vw,
                           (max-width: 1024px) 50vw,
                           33vw"
                    className="object-cover"
                  />
                </div>
              )}

              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  {/* Title */}
                  <h2 className="text-sm font-semibold">
                    {announcement.title}
                  </h2>

                  {/* Pinned badge */}
                  {announcement.pinned && (
                    <Badge className="bg-yellow-300 text-black text-[10px] font-semibold">
                      Pinned
                    </Badge>
                  )}
                </div>

                {/* Announcement date/time */}
                <div className="text-xs text-gray-500 mb-1">
                  {formattedDate}
                </div>

                {/* Snippet */}
                <div className="text-xs text-gray-600">
                  {parse(safeSnippet)}
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between bg-gray-50 rounded-b-md px-3 py-2">
                <Link
                  href={`/announcements/${announcement.id}`}
                  className="text-blue-600 hover:text-blue-500 text-xs transition-colors"
                >
                  Read more →
                </Link>

                <div className="flex items-center gap-2">
                  {onPinToggle && (
                    <Button
                      className={`h-6 px-2 text-xs ${
                        announcement.pinned
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      } border-none`}
                      onClick={() => onPinToggle(announcement)}
                      disabled={loading}
                    >
                      {announcement.pinned ? "Unpin" : "Pin"}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 border-none"
                      onClick={() => onDelete(announcement.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
