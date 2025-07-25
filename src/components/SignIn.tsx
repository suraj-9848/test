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

  const { status } = useSession();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left Panel (Black & White theme) */}
        <div
          style={{
            clipPath: `path('M0,0 
                Q20,0 20,20 
                V100 
                Q20,100 0,100 
                Z 
                M20,0 
                H80 
                Q100,0 100,20 
                V30 
                Q100,40 90,40 
                H20 
                Z')`,
          }}
          className="hidden md:flex flex-col justify-between text-white p-10 bg-black relative rounded-tr-[60px] rounded-bl-[40px]"
        >
          {/* Top Heading */}
          <div>
            <h2 className="text-4xl font-extrabold leading-tight  my-8">
              Welcome to <br />
              <span className="text-white/90">Nirudhyog LMS</span>
            </h2>

            {/* Quote */}
            <div className="text-sm text-white/80 mb-6 leading-relaxed">
              <p>
                “Search and manage your institution easily with Nirudhyog.
                Simplify operations and focus on learning.”
              </p>
            </div>

            {/* User Info */}
            <div className="mb-10">
              <p className="font-bold">Team Nirudhyog</p>
              <p className="text-sm text-white/60">Digital LMS for Everyone</p>
            </div>
          </div>

          {/* Bottom Bubble Box */}
          <div className="mt-10 relative bg-white text-black shadow-md rounded-[24px] p-5">
            <h4 className="font-bold text-base mb-1 leading-snug">
              Control your institution better with Nirudhyog
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              All-in-one platform for admins, instructors, and students.
            </p>

            {/* Fake Avatars */}
            <div className="flex  mt-2">
              <div className="w-7 h-7 bg-gray-400 rounded-full text-white flex items-center justify-center text-xs font-bold">
                A
              </div>
              <div className="w-7 h-7 -translate-x-2 bg-gray-600 rounded-full text-white flex items-center justify-center text-xs font-bold">
                B
              </div>
              <div className="w-7 h-7  -translate-x-4 bg-gray-800 rounded-full text-white flex items-center justify-center text-xs font-bold">
                C
              </div>
              <div className="w-7 h-7  -translate-x-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium">
                +2
              </div>
            </div>

            {/* Star icon bubble */}
            <div className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center">
              <span className="text-black text-lg">★</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="p-6 md:p-8 bg-white text-black">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">N</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-gray-600">
              Sign in to continue to Nirudhyog LMS
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
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
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
                className="w-full px-4 py-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/40 focus:border-black transition"
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
                  className="w-full px-4 py-2 h-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/40 focus:border-black transition pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition"
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
                className="text-sm text-black hover:underline transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition"
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
            <AiOutlineGoogle size={20} className="text-black" />
            <span className="text-gray-800 font-medium">
              Continue with Google
            </span>
          </button>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Don’t have an account?{" "}
              <button className="text-black font-medium hover:underline transition">
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
