// CPTracker related types for admin-dashboard

export interface CPTrackerProfile {
  id: string;
  user_id: string;
  leetcode_username?: string;
  codeforces_username?: string;
  codechef_username?: string;
  atcoder_username?: string;
  active_platforms: string[];
  leetcode_total_problems: number;
  leetcode_easy_solved: number;
  leetcode_medium_solved: number;
  leetcode_hard_solved: number;
  leetcode_current_rating: number;
  leetcode_highest_rating: number;
  leetcode_contests_participated: number;
  leetcode_contest_solved_count: number;
  leetcode_practice_solved_count: number;
  leetcode_last_contest_date?: string;
  leetcode_last_contest_name?: string;
  leetcode_last_updated?: string;
  codeforces_handle?: string;
  codeforces_rating: number;
  codeforces_max_rating: number;
  codeforces_rank?: string;
  codeforces_contests_participated: number;
  codeforces_problems_solved: number;
  codeforces_last_updated?: string;
  codechef_rating: number;
  codechef_highest_rating: number;
  codechef_stars?: string;
  codechef_contests_participated: number;
  codechef_problems_solved: number;
  codechef_last_updated?: string;
  atcoder_rating: number;
  atcoder_highest_rating: number;
  atcoder_color?: string;
  atcoder_contests_participated: number;
  atcoder_problems_solved: number;
  atcoder_last_updated?: string;
  performance_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    batch_id: string;
  };
}

export interface CPTrackerConnection {
  leetcode_username?: string;
  codeforces_username?: string;
  codechef_username?: string;
  atcoder_username?: string;
  active_platforms: string[];
}

export interface CPTrackerLeaderboard {
  rank: number;
  user: {
    id: string;
    username: string;
    profile_picture?: string;
  };
  performance_score: number;
  leetcode_score: number;
  codeforces_score: number;
  codechef_score: number;
  atcoder_score: number;
  leetcode_total_problems: number;
  leetcode_contest_solved_count: number;
  leetcode_practice_solved_count: number;
  leetcode_current_rating: number;
  leetcode_contests_participated: number;
  leetcode_last_contest_name?: string;
  leetcode_last_contest_date?: string;
  codeforces_rating: number;
  codeforces_contests_participated: number;
  codeforces_problems_solved: number;
  codechef_rating: number;
  codechef_contests_participated: number;
  codechef_problems_solved: number;
  atcoder_rating: number;
  atcoder_contests_participated: number;
  atcoder_problems_solved: number;
  platforms_connected: number;
  last_updated: string;
}

export interface CPTrackerStats {
  totalProfiles: number;
  activeProfiles: number;
  recentlyUpdated: number;
  needsUpdate: number;
}

export interface CPTrackerUpdateResult {
  success: number;
  failed: number;
  total: number;
}

export interface CronJobStatus {
  name: string;
  running: boolean;
  schedule: string;
}

export interface PlatformStats {
  platform: "leetcode" | "codeforces" | "codechef" | "atcoder";
  username: string;
  rating: number;
  maxRating: number;
  problemsSolved: number;
  contestsParticipated: number;
  lastUpdated?: string;
}

export interface CPTrackerApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CPTrackerFormData {
  leetcode_username: string;
  codeforces_username: string;
  codechef_username: string;
  atcoder_username: string;
}

export interface CPTrackerFormErrors {
  leetcode_username?: string;
  codeforces_username?: string;
  codechef_username?: string;
  atcoder_username?: string;
  general?: string;
}
