"use client";

import Loader from "@/components/Loader";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

const DashboardLanding = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="max-w-4xl w-full bg-white border border-gray-200 rounded-3xl shadow-xl p-10 animate-fade-in">
        <h1 className="text-4xl font-extrabold text-black mb-3 text-center tracking-tight">
          Welcome to Nirudhyog LMS
        </h1>
        <p className="text-gray-600 text-center mb-10 text-base">
          Empowering learners with a structured roadmap. <br />
          You are signed in as{" "}
          <span className="text-black font-medium">
            {session?.user?.email || "User"}
          </span>
        </p>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-black mb-1">📘 Courses</h3>
            <p className="text-sm text-gray-600">12 curated learning paths</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-black mb-1">👥 Students</h3>
            <p className="text-sm text-gray-600">143 active learners enrolled</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300">
            <h3 className="text-lg font-semibold text-black mb-1">👨‍🏫 Instructors</h3>
            <p className="text-sm text-gray-600">5 experienced mentors</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/dashboard/courses")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Explore Courses
          </button>
          <button
            onClick={() => router.push("/dashboard/profile")}
            className="px-6 py-3 border-2 border-gray-300 text-black rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all duration-200"
          >
            My Profile
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => signOut()}
          className="mt-10 text-sm text-gray-400 hover:text-gray-600 hover:underline transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default DashboardLanding;
