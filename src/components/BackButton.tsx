import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import React from "react";

interface BackButtonProps {
  className?: string;
}

function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  // Merge your default classes with whatever is passed in
  const baseClasses =
    "flex flex-row items-center gap-1 font-medium transition hover:opacity-80 active:opacity-60";

  return (
    <button
      onClick={() => router.back()}
      className={className ? `${baseClasses} ${className}` : baseClasses}
    >
      <Icon icon="ph:arrow-left-bold" />
      Back
    </button>
  );
}

export default BackButton;
