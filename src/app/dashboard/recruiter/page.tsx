"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiBriefcase, FiUsers, FiTrendingUp, FiCalendar, FiFileText, FiStar } from "react-icons/fi";
import { useViewAs } from "../../../contexts/ViewAsContext";

interface RecruiterStats {
  activeJobs: number;
  totalApplications: number;
  scheduledInterviews: number;
  hiredCandidates: number;
  averageTimeToHire: number;
  successRate: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  applications: number;
  status: 'active' | 'paused' | 'closed';
  postedDate: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
}

interface Application {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'selected' | 'rejected';
  appliedDate: string;
  rating: number;
}

interface Interview {
  id: string;
  candidateName: string;
  jobTitle: string;
  dateTime: string;
  type: 'phone' | 'video' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled';
}

const RecruiterDashboard: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const { viewAsRole, isViewingAs } = useViewAs();
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    // Mock data for demonstration
    const mockStats: RecruiterStats = {
      activeJobs: 12,
      totalApplications: 156,
      scheduledInterviews: 8,
      hiredCandidates: 23,
      averageTimeToHire: 18,
      successRate: 78.5
    };

    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        applications: 24,
        status: 'active',
        postedDate: '2024-01-15',
        location: 'Remote',
        type: 'full-time'
      },
      {
        id: '2',
        title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        applications: 18,
        status: 'active',
        postedDate: '2024-01-20',
        location: 'New York, NY',
        type: 'full-time'
      },
      {
        id: '3',
        title: 'React Developer',
        company: 'Digital Solutions',
        applications: 31,
        status: 'paused',
        postedDate: '2024-01-10',
        location: 'San Francisco, CA',
        type: 'contract'
      }
    ];

    const mockApplications: Application[] = [
      {
        id: '1',
        candidateName: 'Alice Johnson',
        jobTitle: 'Senior Frontend Developer',
        status: 'reviewed',
        appliedDate: '2 hours ago',
        rating: 4.5
      },
      {
        id: '2',
        candidateName: 'Bob Smith',
        jobTitle: 'Full Stack Engineer',
        status: 'pending',
        appliedDate: '5 hours ago',
        rating: 0
      },
      {
        id: '3',
        candidateName: 'Carol Williams',
        jobTitle: 'React Developer',
        status: 'interviewed',
        appliedDate: '1 day ago',
        rating: 4.8
      }
    ];

    const mockInterviews: Interview[] = [
      {
        id: '1',
        candidateName: 'David Brown',
        jobTitle: 'Senior Frontend Developer',
        dateTime: '2024-01-25 14:00',
        type: 'video',
        status: 'scheduled'
      },
      {
        id: '2',
        candidateName: 'Eva Davis',
        jobTitle: 'Full Stack Engineer',
        dateTime: '2024-01-26 10:30',
        type: 'phone',
        status: 'scheduled'
      },
      {
        id: '3',
        candidateName: 'Frank Wilson',
        jobTitle: 'React Developer',
        dateTime: '2024-01-27 16:00',
        type: 'in-person',
        status: 'scheduled'
      }
    ];

    setStats(mockStats);
    setJobs(mockJobs);
    setRecentApplications(mockApplications);
    setUpcomingInterviews(mockInterviews);
    setLoading(false);
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'reviewed': return 'text-blue-600 bg-blue-50';
      case 'interviewed': return 'text-purple-600 bg-purple-50';
      case 'selected': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'phone': return '📞';
      case 'in-person': return '🏢';
      default: return '📅';
    }
  };

  const renderStarRating = (rating: number) => {
    if (rating === 0) return <span className="text-gray-400">Not rated</span>;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* View As Banner */}
      {isViewingAs && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FiBriefcase className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              👀 Viewing as: Recruiter Dashboard
            </span>
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Admin View
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Dashboard</h1>
        <p className="text-gray-600">Manage job postings, candidates, and hiring pipeline.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeJobs}</p>
            </div>
            <FiBriefcase className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications}</p>
            </div>
            <FiUsers className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.scheduledInterviews}</p>
            </div>
            <FiCalendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.successRate}%</p>
            </div>
            <FiTrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Jobs */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Active Job Postings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">{job.location}</span>
                      <span className="text-xs text-gray-500">{job.type}</span>
                      <span className="text-xs text-blue-600">{job.applications} applications</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Posted: {job.postedDate}</p>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Applications & Upcoming Interviews */}
        <div className="space-y-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div key={application.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <FiUsers className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{application.candidateName}</p>
                      <p className="text-xs text-gray-600">{application.jobTitle}</p>
                      <p className="text-xs text-gray-500">{application.appliedDate}</p>
                      <div className="mt-1">{renderStarRating(application.rating)}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Interviews</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-start space-x-3">
                    <div className="text-2xl">{getInterviewTypeIcon(interview.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{interview.candidateName}</p>
                      <p className="text-xs text-gray-600">{interview.jobTitle}</p>
                      <p className="text-xs text-blue-600 font-medium">{interview.dateTime}</p>
                      <p className="text-xs text-gray-500 capitalize">{interview.type} interview</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                      {interview.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard; 