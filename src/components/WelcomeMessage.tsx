import { motion } from "framer-motion";

export default function WelcomeMessage({ user }: { user: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <h1 className="mb-2 text-4xl font-bold text-white">
        Welcome back, {user?.firstName}!
      </h1>
      <p className="text-xl text-teal-300">
        Here&apos;s all the latest updates. 
      </p>
    </motion.div>
  );
}

