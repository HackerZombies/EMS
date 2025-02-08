import { Dispatch, SetStateAction } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react"
// If you have a helper for merging class names (like ShadCN's `cn` util), import that. Otherwise, you can do a manual conditional.
import { cn } from "@/lib/utils"

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>

  showPinnedOnly: boolean
  setShowPinnedOnly: Dispatch<SetStateAction<boolean>>
  showArchived: boolean
  setShowArchived: Dispatch<SetStateAction<boolean>>

  onClearAll?: () => void
  isLoading?: boolean

  // Add the optional className prop
  className?: string
}

export function SearchBarAndFilter({
  searchTerm,
  setSearchTerm,
  showPinnedOnly,
  setShowPinnedOnly,
  showArchived,
  setShowArchived,
  onClearAll,
  isLoading,
  className, // receive here
}: SearchBarProps) {
  return (
    <div
      // Merge your default styling classes with the optional className passed in
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4",
        className
      )}
    >
      {/* Search Input */}
      <Input
        placeholder="Search Announcements..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="md:w-1/2"
      />

      {/* Filter Toggles */}
      <div className="flex items-center gap-4 text-sm text-gray-300">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showPinnedOnly}
            onChange={() => setShowPinnedOnly(!showPinnedOnly)}
          />
          Pinned Only
        </label>

        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={() => setShowArchived(!showArchived)}
          />
          Show Archived
        </label>

        {onClearAll && (
          <Button
            variant="destructive"
            onClick={onClearAll}
            disabled={isLoading}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isLoading ? (
              <>
                <Icon
                  icon="svg-spinners:90-ring-with-bg"
                  className="mr-2"
                />
                Clearing...
              </>
            ) : (
              <>Clear All</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
