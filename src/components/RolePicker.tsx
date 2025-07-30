"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronDown, FiUser, FiUsers, FiBookOpen, FiBriefcase, FiShield } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export type ViewAsRole = 'admin' | 'instructor' | 'student' | 'recruiter';

interface RolePickerProps {
  currentViewRole: ViewAsRole;
  onRoleChange: (role: ViewAsRole) => void;
}

const roleConfig = {
  admin: {
    label: 'Admin View',
    icon: FiShield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Full administrative access'
  },
  instructor: {
    label: 'Instructor View',
    icon: FiBookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Course and student management'
  },
  student: {
    label: 'Student View',
    icon: FiUser,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Learning dashboard'
  },
  recruiter: {
    label: 'Recruiter View',
    icon: FiBriefcase,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Hiring and recruitment tools'
  }
};

const RolePicker: React.FC<RolePickerProps> = ({ currentViewRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only show the picker for admin users
  if (!user || user.userRole !== 'admin') {
    return null;
  }

  const currentRole = roleConfig[currentViewRole];
  const CurrentIcon = currentRole.icon;

  const handleRoleChange = async (newRole: ViewAsRole) => {
    if (newRole === currentViewRole || isChanging) return;

    setIsChanging(true);
    setIsOpen(false);

    try {
      // Update the view role
      onRoleChange(newRole);
      
      // Navigate to the appropriate dashboard
      const routeMap = {
        admin: '/dashboard/admin',
        instructor: '/dashboard/instructor',
        student: '/dashboard/student',
        recruiter: '/dashboard/recruiter'
      };

      await router.push(routeMap[newRole]);
    } catch (error) {
      console.error('Failed to switch view:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const availableRoles: ViewAsRole[] = ['admin', 'instructor', 'student', 'recruiter'];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Role Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200
          ${currentRole.bgColor} ${currentRole.borderColor} ${currentRole.color}
          hover:shadow-md hover:scale-105 active:scale-95
          ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          min-w-[140px]
        `}
      >
        <div className="flex items-center space-x-2">
          <CurrentIcon className="w-4 h-4" />
          <span className="text-sm font-medium truncate">
            {currentRole.label}
          </span>
        </div>
        {!isChanging && (
          <FiChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
        {isChanging && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isChanging && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Switch Dashboard View
            </p>
            <p className="text-xs text-gray-400 mt-1">
              View the system from different user perspectives
            </p>
          </div>
          
          <div className="py-2">
            {availableRoles.map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              const isActive = role === currentViewRole;
              
              return (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`
                    w-full flex items-start space-x-3 px-3 py-3 hover:bg-gray-50 transition-colors duration-150
                    ${isActive ? 'bg-gray-50' : ''}
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    ${config.bgColor} ${config.borderColor} border
                  `}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {config.label}
                      </span>
                      {isActive && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              💡 This feature allows admins to test the system from different user perspectives
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePicker; 