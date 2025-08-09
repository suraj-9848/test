import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";

// Minutes threshold to mark a meeting as "starting soon"
export const STARTING_SOON_MINUTES = 15;

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  link: string;
  startTime: string; // ISO string
  endTime: string; // ISO string (endTime > startTime)
  approvedEmails: string[];
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  link: string; // Full join URL (Teams / Zoom etc.)
  startTime: string; // ISO
  endTime: string; // ISO (must be > startTime)
  approvedEmails: string[]; // Allowed student emails
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  link?: string;
  startTime?: string;
  endTime?: string;
  approvedEmails?: string[];
}

// Shape coming from backend may vary; keep flexible type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeMeeting = (raw: any): Meeting | null => {
  if (!raw) return null;
  // Support nested wrapper e.g. { meeting: {...} }
  if (raw.meeting) return normalizeMeeting(raw.meeting);

  const id = raw.id || raw._id || raw.meetingId || "";
  const title = raw.title || raw.name || "Untitled";
  const description = raw.description || raw.details || raw.desc || "";
  const link = raw.link || raw.joinLink || raw.url || "";

  // Legacy scheduledTime fallback -> startTime
  let startTime: string =
    raw.startTime || raw.scheduledTime || raw.start || raw.beginTime || "";
  let endTime: string =
    raw.endTime || raw.finishTime || raw.end || raw.stopTime || "";

  if (!startTime && raw.date) {
    // If only date provided
    startTime = new Date(raw.date).toISOString();
  }

  // Ensure ISO format if looks like a date but not ISO
  const toIso = (v: string): string => {
    if (!v) return v;
    // If already ISO-ish
    if (/\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toISOString();
    return new Date(v).toISOString();
  };

  if (startTime) startTime = toIso(startTime);

  if (endTime) {
    endTime = toIso(endTime);
  } else if (startTime) {
    // Fallback: +1 hour
    endTime = new Date(
      new Date(startTime).getTime() + 60 * 60 * 1000,
    ).toISOString();
  }

  // Guard: if end <= start, push end 1h ahead
  if (startTime && endTime) {
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();
    if (e <= s) {
      endTime = new Date(s + 60 * 60 * 1000).toISOString();
    }
  }

  const approvedEmails: string[] = (
    raw.approvedEmails ||
    raw.allowedEmails ||
    raw.emails ||
    []
  )
    .map((x: string) => x)
    .filter(Boolean);

  const courseId = raw.courseId || raw.course_id || raw.cid || "";

  return {
    id,
    title,
    description,
    link,
    startTime,
    endTime,
    approvedEmails,
    courseId,
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractArray = (resp: any): any[] => {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.meetings)) return resp.meetings;
  if (Array.isArray(resp.data)) return resp.data;
  if (resp.data && Array.isArray(resp.data.meetings)) return resp.data.meetings;
  if (resp.result && Array.isArray(resp.result)) return resp.result;
  return [];
};

const normalizeList = (rawList: unknown): Meeting[] => {
  return extractArray(rawList)
    .map((r) => normalizeMeeting(r))
    .filter(Boolean) as Meeting[];
};

const meetingApi = {
  async list(courseId: string): Promise<Meeting[]> {
    const res = await apiClient.get(
      API_ENDPOINTS.INSTRUCTOR.MEETINGS(courseId),
    );
    return normalizeList(res.data);
  },
  async get(courseId: string, meetingId: string): Promise<Meeting> {
    const res = await apiClient.get(
      API_ENDPOINTS.INSTRUCTOR.MEETING_BY_ID(courseId, meetingId),
    );
    const m = normalizeMeeting(res.data.meeting || res.data);
    if (!m) throw new Error("Meeting not found");
    return m;
  },
  async create(courseId: string, data: CreateMeetingDto): Promise<Meeting> {
    const res = await apiClient.post(
      API_ENDPOINTS.INSTRUCTOR.MEETINGS(courseId),
      data,
    );
    const m = normalizeMeeting(res.data.meeting || res.data);
    if (!m) throw new Error("Invalid create meeting response");
    return m;
  },
  async update(
    courseId: string,
    meetingId: string,
    data: UpdateMeetingDto,
  ): Promise<Meeting> {
    const res = await apiClient.patch(
      API_ENDPOINTS.INSTRUCTOR.MEETING_BY_ID(courseId, meetingId),
      data,
    );
    const m = normalizeMeeting(res.data.meeting || res.data);
    if (!m) throw new Error("Invalid update meeting response");
    return m;
  },
  async remove(courseId: string, meetingId: string): Promise<void> {
    await apiClient.delete(
      API_ENDPOINTS.INSTRUCTOR.MEETING_BY_ID(courseId, meetingId),
    );
  },
  // Student side (filtered by backend)
  async studentList(courseId: string): Promise<Meeting[]> {
    const res = await apiClient.get(
      API_ENDPOINTS.STUDENT.COURSE_MEETINGS(courseId),
    );
    return normalizeList(res.data);
  },
};

export default meetingApi;
