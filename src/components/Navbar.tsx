"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import RolePicker from "./RolePicker";
import { useViewAs } from "../contexts/ViewAsContext";

const Navbar = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { viewAsRole, setViewAsRole } = useViewAs();

  const user = session?.user;
  const userInitial = user?.name?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Nirudhyog</h1>
          </div>

          {/* Center section - Role Picker for Admin */}
          <div className="flex-1 flex justify-center">
            <RolePicker 
              currentViewRole={viewAsRole}
              onRoleChange={setViewAsRole}
            />
          </div>

          {/* Right section */}
          {status === "authenticated" ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="relative">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-gray-300 transition-all duration-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-gray-200 group-hover:ring-gray-300 transition-all duration-200">
                      {userInitial}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || "No email"}
                  </p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80 py-2 z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
                          {userInitial}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs break-all text-gray-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group">
                      <FiUser className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-500" />
                      View Profile
                    </button>
                    <button className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group">
                      <FiSettings className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-500" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={() => signOut()}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-all duration-200 group"
                    >
                      <FiLogOut className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                router.push("/");
              }}
              className="bg-gray-800 text-white text-sm px-4 py-2 rounded-xl hover:bg-gray-900 transition-all duration-200"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
