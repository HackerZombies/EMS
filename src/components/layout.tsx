// src/components/layout.tsx
import { useSession } from "next-auth/react";
import SignIn from "@/components/signin";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/router";
import { Icon } from "@iconify/react";
import DashboardLayout from "./DashboardLayout";
import backgroundImage from "../../public/bg.jpg";
import { NotificationListener } from "@/components/NotificationListener";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  return (
    <div
      className="min-h-dvh text-black antialiased"
      style={{
        background: `linear-gradient(rgba(30,30,30,0.85), rgba(30,30,30,0.85)), url(${backgroundImage.src}) center / cover no-repeat fixed`,
      }}
    >
      <div
        className="absolute inset-0 backdrop-filter backdrop-blur-lg"
        style={{ zIndex: -1 }}
      ></div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ ease: "easeInOut", duration: 0.3 }}
        >
          {/* Loading State */}
          {status === "loading" && (
            <div className="flex min-h-dvh items-center justify-center gap-2 bg-transparent text-xl font-medium text-white">
              <Icon icon="svg-spinners:90-ring-with-bg" />
              <p>Loading...</p>
            </div>
          )}

          {/* Authenticated State */}
          {status === "authenticated" && (
            <>
              {/* Place NotificationListener here so it only mounts for authenticated users */}
              <NotificationListener />

              <DashboardLayout>
                <AnimatePresence
                  mode="wait"
                  onExitComplete={() => window.scrollTo(0, 0)}
                >
                  <motion.div
                    key={router.route}
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  >
                    <main className="flex-1 min-h-dvh flex flex-col pt-0 px-4 pb-8 text-white drop-shadow">
                      {children}
                    </main>
                  </motion.div>
                </AnimatePresence>
              </DashboardLayout>
            </>
          )}

          {/* Unauthenticated State */}
          {status === "unauthenticated" && <SignIn />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
