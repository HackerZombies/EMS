// pages/auth/reset-password.tsx

import { useState, FormEvent, useEffect } from "react";
import { getSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { CircularProgress } from "@mui/material";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Ensure the user is authenticated and isFirstTime
  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      if (!session) {
        router.push("/auth/signin");
      } else if (!session.user.isFirstTime) {
        router.push("/");
      }
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/resset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Optionally sign out and sign back in
        await signOut({ redirect: false });
        router.push("/auth/signin");
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password - EMS</title>
      </Head>
      <div className="flex h-screen items-center justify-center bg-gray-800">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Set Your New Password</h2>
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? <CircularProgress size={24} /> : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
