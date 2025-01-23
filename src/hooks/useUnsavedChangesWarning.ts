// src/hooks/useUnsavedChangesWarning.ts

import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";

const useUnsavedChangesWarning = (hasUnsavedChanges: boolean) => {
  const router = useRouter();

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    },
    [hasUnsavedChanges]
  );

  const handleRouteChange = useCallback(
    (url: string) => {
      if (!hasUnsavedChanges) return;
      const confirmLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) {
        // Prevent route change
        throw "Route change aborted.";
      }
    },
    [hasUnsavedChanges]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [handleBeforeUnload, handleRouteChange, router]);
};

export default useUnsavedChangesWarning;
