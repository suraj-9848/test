"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineGoogle,
} from "react-icons/ai";

const roles = ["Admin", "College Admin", "Instructor"];

const SignIn = () => {
  const [role, setRole] = useState(roles[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login with:", { email, password, role });
  };

  const handleGoogleSignIn = () => {
    signIn("google", {
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-white to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white/60 backdrop-blur-md border border-gray-200/50 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left Panel (Hidden on small screens) */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-10">
          <div>
            <h2 className="text-4xl font-extrabold mb-4 leading-tight">
              Welcome to{" "}
              <span className="text-white underline decoration-white/40">
                Nirudhuyog LMS
              </span>
            </h2>
            <p className="text-base text-violet-100 leading-relaxed">
              Manage institutions, instructors, learners, and courses—all from a
              single unified admin panel. Simplifying your learning operations
              with powerful tools and seamless access.
            </p>
          </div>

          <div className="mt-10 bg-white/10 p-5 rounded-xl shadow-inner">
            <p className="text-sm italic mb-3">
              “Empowering education through seamless digital learning
              management.”
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/30 rounded-full flex items-center justify-center text-white text-sm font-bold">
                N
              </div>
              <div>
                <p className="text-sm font-semibold">Nirudhuyog Team</p>
                <p className="text-xs opacity-80">
                  Admin Portal • LMS Platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="p-6 md:p-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">N</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
              Admin Sign In
            </h1>
            <p className="text-sm text-gray-600">
              Access the Nirudhuyog LMS dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`text-sm px-2 py-2 rounded-lg border transition-all duration-200 font-medium ${
                      role === r
                        ? "bg-violet-100 text-violet-600 border-violet-400"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition text-gray-700"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition text-gray-700 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-violet-500 transition"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-violet-600 hover:text-violet-700 transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-md hover:from-violet-700 hover:to-indigo-700 transition"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-sm text-gray-500">or continue with</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            <AiOutlineGoogle size={20} className="text-red-500" />
            <span className="text-gray-700 font-medium">
              Continue with Google
            </span>
          </button>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button className="text-violet-600 hover:text-violet-700 font-medium transition">
                Contact administrator
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
