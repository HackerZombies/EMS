import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import Head from "next/head";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import Image from "next/image";
import fdmLogo from "../../public/fdm.svg";
import { CircularProgress } from "@mui/material";
import { ForgotPasswordModal } from "../components/ForgotPasswordModal";

export default function SignIn() {
  const router = useRouter();
  const [incorrectLogin, setIncorrectLogin] = useState(false);
  const [forgotPasswordPopup, setForgotPasswordPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString().trim();

    if (!username || !password) {
      setIncorrectLogin(true);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username,
        password,
        callbackUrl: "/",
        redirect: false,
      });
      setLoading(false);

      if (result?.ok) {
        setIncorrectLogin(false);
        router.push(result.url || "/");
      } else {
        setIncorrectLogin(true);
      }
    } catch (error) {
      setLoading(false);
      console.error("Sign-In Error:", error);
      setIncorrectLogin(true);
    }
  }

  return (
    <>
      <Head>
        <title>Employee Management System - Sign in</title>
      </Head>
      <div className="flex h-screen items-center justify-center bg-opacity-5 from-gray-800 to-black">
        <div className="w-full max-w-md bg-black rounded-lg shadow-md p-8 bg-opacity-50">
          <div className="text-center mb-8">
            <div className="mx-auto w-24 mb-2">
              {/* Ensure the priority attribute is used for important images */}
              <Image src={fdmLogo} alt="FDM" width={96} height={96} priority />
            </div>
            <h1 className="text-3xl font-bold text-white">EMS Sign In</h1>
          </div>
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                User ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Icon icon="ph:user-bold" className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    <Icon icon={passwordVisible ? "ph:eye-slash-bold" : "ph:eye-bold"} className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {incorrectLogin && <p className="text-sm text-red-600">Invalid username or password.</p>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? <CircularProgress size={24} /> : "Sign In"}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setForgotPasswordPopup(true)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
      <ForgotPasswordModal
        visible={forgotPasswordPopup}
        onClose={() => setForgotPasswordPopup(false)}
      />
    </>
  );
}
