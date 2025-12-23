"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { IconBrandGoogle, IconLoader2, IconEye, IconEyeOff, IconArrowRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setErrorMessage(result.error || "Invalid username or password.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
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

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = isRegistering ? handleRegister : handleLogin;

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fc] text-neutral-800 font-sans overflow-x-hidden overflow-y-auto">
      {/* Mobile/Tablet Background Pattern (Visible on smaller screens) */}
      <div className="lg:hidden absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://img.autocarpro.in/autocarpro/d9bfc69e-2c42-4740-9c83-937d2925c5e3_image.png"
            alt="Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fc]/90 to-[#f8f9fc]/95 backdrop-blur-sm" />
        </div>
        <div className="absolute -top-[30%] -left-[30%] w-[100%] h-[100%] rounded-full bg-red-500/10 blur-[100px]" />
        <div className="absolute top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-orange-400/10 blur-[100px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1920px] mx-auto flex flex-col lg:flex-row z-10 relative">

        {/* Left Side - Hero / Image (Desktop only) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-1 relative bg-black m-3 rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/10"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-10" />
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
              src="https://img.autocarpro.in/autocarpro/d9bfc69e-2c42-4740-9c83-937d2925c5e3_image.png"
              className="w-full h-full object-cover opacity-70"
              alt="Heavy Vehicle Manufacturing"
            />
          </div>

          <div className="relative z-20 w-full h-full flex flex-col justify-between p-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                <img
                  src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center"
                  alt="VBCL Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-xl"
            >
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                Master your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
                  production flow.
                </span>
              </h1>
              <p className="text-lg text-neutral-400 leading-relaxed max-w-md">
                Experience the next generation of ERP systems.
                Built for speed, precision, and clarity.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px] bg-white/50 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none p-8 lg:p-0 rounded-[32px] lg:rounded-none shadow-xl lg:shadow-none border border-white/50 lg:border-none"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10">
                <img
                  src="https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center"
                  alt="VBCL Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>

            <div className="mb-10 text-center lg:text-left">
              <motion.h2
                key={isRegistering ? "reg-title" : "login-title"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900"
              >
                {isRegistering ? "Create Account" : "Welcome Back"}
              </motion.h2>
              <motion.p
                key={isRegistering ? "reg-desc" : "login-desc"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 text-neutral-500 font-medium"
              >
                {isRegistering
                  ? "Start your journey with us today."
                  : "Enter your details to access your workspace."}
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent hover:border-neutral-200 focus:border-red-500 focus:bg-white transition-all outline-none font-semibold text-neutral-900 placeholder:text-neutral-300 shadow-sm ring-1 ring-neutral-100"
                    placeholder="Enter your username"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1 flex justify-between">
                    Password
                    {isRegistering && <span className="text-red-500 normal-case tracking-normal">Min. 8 chars</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent hover:border-neutral-200 focus:border-red-500 focus:bg-white transition-all outline-none font-semibold text-neutral-900 placeholder:text-neutral-300 shadow-sm ring-1 ring-neutral-100 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                    >
                      {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isRegistering && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Confirm Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-transparent hover:border-neutral-200 focus:border-red-500 focus:bg-white transition-all outline-none font-semibold text-neutral-900 placeholder:text-neutral-300 shadow-sm ring-1 ring-neutral-100"
                          placeholder="••••••••"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-3 border border-red-100 shadow-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  {errorMessage}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-[#E01E1F] hover:bg-[#C01818] text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-500/20 hover:shadow-red-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <IconLoader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <span>{isRegistering ? "Create Account" : "Sign In"}</span>
                    <IconArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </>
                )}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-neutral-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#f8f9fc] text-neutral-400 font-bold uppercase tracking-wider text-xs">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button type="button" className="w-full flex items-center justify-center gap-3 bg-white border-2 border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold py-3.5 rounded-2xl transition-all">
                  <IconBrandGoogle size={22} className="" />
                  <span>Google</span>
                </button>
              </div>

            </form>

            <div className="mt-8 text-center">
              <p className="text-neutral-500 font-medium">
                {isRegistering ? "Already have an account? " : "New to VBCL Alwar? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setErrorMessage("");
                    setUsername("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="font-bold text-[#E01E1F] hover:text-[#C01818] transition-colors inline-flex items-center gap-1 hover:underline underline-offset-4"
                >
                  {isRegistering ? "Sign in" : "Create an account"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
