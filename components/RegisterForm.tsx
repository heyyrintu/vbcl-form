"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Registration successful! Signing you in...");

      const signInResult = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (signInResult?.error) {
        setErrorMessage(signInResult.error || "Login failed after registration. Please sign in.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <img
            src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center"
            alt="VBCL Alwar Logo"
            className="h-32 w-32 mb-6 object-contain"
          />
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register to VBCL Alwar Production Tracker
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#DE1C1C] focus:border-[#DE1C1C] focus:z-10 sm:text-sm"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password (min. 8 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#DE1C1C] focus:border-[#DE1C1C] focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#DE1C1C] focus:border-[#DE1C1C] focus:z-10 sm:text-sm"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#DE1C1C] hover:bg-[#C01818] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DE1C1C] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="font-medium text-[#DE1C1C] hover:text-[#C01818]">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
