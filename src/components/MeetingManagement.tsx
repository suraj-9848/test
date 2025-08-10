import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Video,
  Plus,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  RefreshCcw,
  Search,
  FilterX,
} from "lucide-react";
import meetingApi, {
  Meeting,
  CreateMeetingDto,
  UpdateMeetingDto,
  STARTING_SOON_MINUTES,
} from "@/api/meetingApi";
import { API_ENDPOINTS } from "@/config/urls";
import apiClient from "@/utils/axiosInterceptor";
import { useToast } from "./ToastContext"; // added toast hook

interface InstructorCourse {
  id: string;
  title: string;
}

const MeetingManagement: React.FC = () => {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  // Advanced derived + filters
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all|live|starting|upcoming|ended
  const [search, setSearch] = useState("");
  const [showEnded, setShowEnded] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const initialForm: CreateMeetingDto = {
    title: "",
    description: "",
    link: "",
    startTime: "",
    endTime: "",
    approvedEmails: [],
  };
  const [form, setForm] = useState<CreateMeetingDto>(initialForm);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const { showToast } = useToast(); // initialize toast
  const [linkError, setLinkError] = useState<string>(""); // URL validation error

  // Fetch courses once
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        setError("");
        const res = await apiClient.get(API_ENDPOINTS.INSTRUCTOR.COURSES);
        const list = res.data?.courses || res.data || [];
        setCourses(list.map((c: any) => ({ id: c.id, title: c.title })));
      } catch (e: any) {
        setError(e?.message || "Failed to load courses");
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch meetings when course changes
  useEffect(() => {
    const loadMeetings = async () => {
      if (!selectedCourseId) {
        setMeetings([]);
        return;
      }
      try {
        setMeetingsLoading(true);
        setError("");
        const list = await meetingApi.list(selectedCourseId);
        const arr = Array.isArray(list) ? list : [];
        setMeetings(
          arr.sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          ),
        );
      } catch (e: any) {
        setMeetingsLoading(false);
      }
    };
    loadMeetings();
  }, [selectedCourseId]);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30_000); // 30s heartbeat
    return () => clearInterval(id);
  }, []);

  const refreshMeetings = useCallback(async () => {
    if (!selectedCourseId) return;
    try {
      setMeetingsLoading(true);
      setError("");
      const list = await meetingApi.list(selectedCourseId);
      const arr = Array.isArray(list) ? list : [];
      setMeetings(
        arr
          .map((m) => ({ ...m }))
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          ),
      );
      setLastLoadedAt(Date.now());
    } catch (e: any) {
      const msg = e?.message || "Failed to load meetings";
      setError(msg);
      showToast("error", msg);
    } finally {
      setMeetingsLoading(false);
    }
  }, [selectedCourseId, showToast]);

  // Refresh meetings list on course change
  useEffect(() => {
    if (!selectedCourseId) {
      setMeetings([]);
      return;
    }
    refreshMeetings();
  }, [selectedCourseId, refreshMeetings]);

  const formatNowLocal = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`; // datetime-local format
  };

  // Convert stored ISO (UTC) to a value acceptable by <input type="datetime-local"> in local time
  const toLocalInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`; // local components (no TZ)
  };

  const resetForm = () => {
    const start = formatNowLocal();
    const endDate = new Date();
    endDate.setMinutes(endDate.getMinutes() + 60); // default +1h
    const pad = (n: number) => String(n).padStart(2, "0");
    const end = `${endDate.getFullYear()}-${pad(
      endDate.getMonth() + 1,
    )}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(
      endDate.getMinutes(),
    )}`;
    setForm({ ...initialForm, startTime: start, endTime: end });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };
  const openEdit = (m: Meeting) => {
    setEditing(m);
    // Restore: use existing meeting's stored times (converted to datetime-local)
    setForm({
      title: m.title,
      description: m.description || "",
      link: m.link,
      startTime: m.startTime.slice(0, 16),
      endTime: m.endTime.slice(0, 16),
      approvedEmails: m.approvedEmails || [],
    });
    setLinkError("");
    setShowForm(true);
  };

  // Pure validator: returns validity + whether domain is recognized (no side-effects)
  const validateMeetingUrl = (
    url: string,
  ): { valid: boolean; recognizedDomain: boolean } => {
    if (!url) return { valid: false, recognizedDomain: false };
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol))
        return { valid: false, recognizedDomain: false };
      const allowedDomains = [
        "zoom.us",
        "us02web.zoom.us",
        "meet.google.com",
        "teams.microsoft.com",
        "webex.com",
        "gotomeeting.com",
        "bluejeans.com",
        "ringcentral.com",
        "join.me",
        "whereby.com",
        "demio.com",
        "zoho.com",
        "livestorm.co",
        "jitsi.org",
        "gather.town",
        "cisco.com",
        "8x8.vc",
        "skype.com",
        "startmeeting.com",
        "bigbluebutton.org",
        "vsee.com",
      ];
      const recognizedDomain = allowedDomains.some(
        (d) => u.hostname === d || u.hostname.endsWith("." + d),
      );
      const valid =
        !!u.hostname &&
        /^https?:$/.test(u.protocol) &&
        url.length < 2048 &&
        /\S/.test(url) &&
        !url.includes(" ");
      return { valid, recognizedDomain };
    } catch {
      return { valid: false, recognizedDomain: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    try {
      setSubmitting(true);
      const payload: CreateMeetingDto | UpdateMeetingDto = {
        ...form,
        startTime: form.startTime
          ? new Date(form.startTime).toISOString()
          : new Date().toISOString(),
        endTime: form.endTime
          ? new Date(form.endTime).toISOString()
          : new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        approvedEmails: form.approvedEmails
          .filter(Boolean)
          .map((e) => e.trim()),
      };
      // URL validation (pure)
      const { valid: urlValid, recognizedDomain } = validateMeetingUrl(
        form.link,
      );
      if (!urlValid) {
        const msg = "Please enter a valid meeting URL (https://...)";
        setLinkError(msg);
        showToast("error", msg);
        setSubmitting(false);
        return;
      } else {
        setLinkError("");
      }
      // Basic time validation
      if (payload.startTime && payload.endTime) {
        const startMs = new Date(payload.startTime).getTime();
        const endMs = new Date(payload.endTime).getTime();
        if (endMs <= startMs) {
          const msg = "End time must be after start time";
          setError(msg);
          showToast("error", msg);
          setSubmitting(false);
          return;
        }
      }
      let successMsg = editing
        ? "Meeting updated successfully"
        : "Meeting created successfully";
      // Perform API call
      if (editing) {
        await meetingApi.update(selectedCourseId, editing.id, payload);
      } else {
        await meetingApi.create(selectedCourseId, payload as CreateMeetingDto);
      }
      // Append domain advisory inside same success toast (avoid overlap)
      if (!recognizedDomain) {
        successMsg += " (Unrecognized meeting domain—please verify URL)";
      }
      showToast("success", successMsg);

      const list = await meetingApi.list(selectedCourseId);
      const arr = Array.isArray(list) ? list : [];
      setMeetings(
        arr.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      );
      setShowForm(false);
      resetForm();
      refreshMeetings();
    } catch (e: any) {
      const msg = e?.message || "Save failed";
      setError(msg);
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (m: Meeting) => {
    if (!selectedCourseId) return;
    if (!confirm(`Delete meeting "${m.title}"?`)) return;
    try {
      await meetingApi.remove(selectedCourseId, m.id);
      setMeetings((prev) => prev.filter((x) => x.id !== m.id));
      showToast("success", "Meeting deleted");
    } catch (e: any) {
      const msg = e?.message || "Delete failed";
      setError(msg);
      showToast("error", msg);
    }
  };

  const computeStatus = (
    start: number,
    end: number,
  ): "live" | "starting" | "upcoming" | "ended" => {
    if (nowTs >= end) return "ended";
    if (nowTs >= start && nowTs < end) return "live";
    const minsUntil = (start - nowTs) / 60000;
    if (minsUntil <= STARTING_SOON_MINUTES && minsUntil >= 0) return "starting";
    return "upcoming";
  };

  const annotatedMeetings = useMemo(() => {
    return meetings.map((m) => {
      const startMs = new Date(m.startTime).getTime();
      const endMs = new Date(m.endTime).getTime();
      const status = computeStatus(startMs, endMs);
      const durationMin = Math.max(1, Math.round((endMs - startMs) / 60000));
      return { ...m, startMs, endMs, status, durationMin } as Meeting & {
        startMs: number;
        endMs: number;
        status: string;
        durationMin: number;
      };
    });
  }, [meetings, nowTs]);

  const relativeTime = (target: number) => {
    const diffMs = target - nowTs;
    const abs = Math.abs(diffMs);
    const mins = Math.round(abs / 60000);
    if (mins < 1) return diffMs >= 0 ? "in <1m" : "<1m ago";
    if (mins < 60) return diffMs >= 0 ? `in ${mins}m` : `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return diffMs >= 0 ? `in ${hours}h` : `${hours}h ago`;
    const days = Math.round(hours / 24);
    return diffMs >= 0 ? `in ${days}d` : `${days}d ago`;
  };

  const filtered = useMemo(() => {
    return annotatedMeetings.filter((m) => {
      if (!showEnded && m.status === "ended") return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(
            m.title.toLowerCase().includes(q) ||
            (m.description || "").toLowerCase().includes(q)
          )
        )
          return false;
      }
      return true;
    });
  }, [annotatedMeetings, statusFilter, search, showEnded]);

  const grouped = useMemo(() => {
    // Keep chronological by start
    return filtered.sort((a, b) => a.startMs - b.startMs);
  }, [filtered]);

  const statusPillConfig: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "starting", label: "Starting Soon" },
    { key: "upcoming", label: "Upcoming" },
    { key: "ended", label: "Ended" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <Video className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Meetings
            </h1>
            <p className="text-slate-600">Schedule & manage live sessions.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-3 border border-slate-200 rounded-xl bg-white/80 min-w-[240px]"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">Select course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            onClick={openCreate}
            disabled={!selectedCourseId}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!selectedCourseId && (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-2xl bg-white/60">
          <p className="text-slate-500">
            Select a course to view or create meetings.
          </p>
        </div>
      )}

      {selectedCourseId && loading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin w-4 h-4" /> Loading...
        </div>
      )}

      {selectedCourseId && meetingsLoading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin w-4 h-4" /> Loading meetings...
        </div>
      )}

      {selectedCourseId && !meetingsLoading && meetings.length === 0 && (
        <div className="p-10 text-center rounded-2xl bg-white border border-slate-200">
          <p className="text-slate-500">
            No meetings yet. Create the first one.
          </p>
        </div>
      )}

      {selectedCourseId && meetings.length > 0 && !meetingsLoading && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {statusPillConfig.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setStatusFilter(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    statusFilter === p.key
                      ? "bg-blue-600 text-white border-blue-600 shadow"
                      : "bg-white text-slate-600 hover:bg-slate-50 border-slate-300"
                  }`}
                  aria-pressed={statusFilter === p.key}
                  aria-label={`Filter ${p.label}`}
                >
                  {p.label}
                </button>
              ))}
              {(statusFilter !== "all" || search || !showEnded) && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSearch("");
                    setShowEnded(true);
                  }}
                  type="button"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <FilterX className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search meetings..."
                  className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 w-60 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showEnded}
                  onChange={(e) => setShowEnded(e.target.checked)}
                  className="accent-blue-600"
                />
                Show Ended
              </label>
              <button
                onClick={refreshMeetings}
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm hover:bg-slate-50"
              >
                <RefreshCcw className="w-4 h-4" /> Refresh
                {lastLoadedAt && (
                  <span className="text-xs text-slate-400 ml-1">
                    {relativeTime(lastLoadedAt)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {grouped.length === 0 && (
            <div className="p-10 text-center rounded-2xl bg-white border border-slate-200">
              <p className="text-slate-500 text-sm">
                No meetings match filters.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map((m) => {
              const badgeCfg = {
                live: {
                  text: "Live",
                  cls: "bg-red-100 text-red-600 animate-pulse",
                },
                starting: {
                  text: "Starting Soon",
                  cls: "bg-amber-100 text-amber-700",
                },
                upcoming: {
                  text: "Upcoming",
                  cls: "bg-emerald-100 text-emerald-700",
                },
                ended: {
                  text: "Ended",
                  cls: "bg-slate-200 text-slate-600",
                },
              }[m.status as "live" | "starting" | "upcoming" | "ended"];
              const canJoin = m.status === "live" || m.status === "starting";
              return (
                <div
                  key={m.id}
                  className={`group relative rounded-2xl border border-slate-200 ${
                    m.status === "ended" ? "bg-slate-50" : "bg-white"
                  } p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition`}
                >
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex flex-wrap gap-1">
                      <span>{new Date(m.startTime).toLocaleString()}</span>
                      <span>— {new Date(m.endTime).toLocaleTimeString()}</span>
                      <span>• {m.durationMin}m</span>
                    </p>
                  </div>
                  {m.description && (
                    <p
                      className="text-sm text-slate-600 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: m.description,
                      }}
                    />
                  )}
                  <div className="text-[11px] text-slate-500 flex gap-2 flex-wrap">
                    {m.status === "upcoming" && (
                      <span>Starts {relativeTime(m.startMs)}</span>
                    )}
                    {m.status === "starting" && (
                      <span>Starts {relativeTime(m.startMs)}</span>
                    )}
                    {m.status === "live" && (
                      <span>Ends {relativeTime(m.endMs)}</span>
                    )}
                    {m.status === "ended" && (
                      <span>Ended {relativeTime(m.endMs)}</span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <button
                      onClick={() => canJoin && window.open(m.link, "_blank")}
                      type="button"
                      className={`text-sm px-3 py-2 rounded-lg flex items-center gap-1 font-medium ${
                        canJoin
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {m.status === "live" && "Join Now"}
                      {m.status === "starting" && "Join (Soon)"}
                      {m.status === "upcoming" && "Not Yet"}
                      {m.status === "ended" && "Ended"}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        type="button"
                        className="p-2 rounded-lg hover:bg-slate-100"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        type="button"
                        className="p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full font-medium ${badgeCfg.cls}`}
                  >
                    {badgeCfg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">
                {editing ? "Edit Meeting" : "Create Meeting"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                type="button"
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    placeholder="Session title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endTime}
                    min={form.startTime}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Join Link *
                </label>
                <input
                  required
                  value={form.link}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, link: v }));
                    if (linkError) {
                      const { valid } = validateMeetingUrl(v);
                      if (valid) setLinkError("");
                    }
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 ${
                    linkError ? "border-red-400" : "border-slate-300"
                  }`}
                  placeholder="https://teams.microsoft.com/..."
                />
                {linkError && (
                  <p className="text-xs text-red-600 mt-1">{linkError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 h-28 resize-none"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Approved Emails (comma separated)
                </label>
                <textarea
                  value={form.approvedEmails.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      approvedEmails: e.target.value
                        .split(/[\n,]/)
                        .map((x) => x.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  placeholder="student1@example.com, student2@example.com"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Students only see meetings where their email is approved.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingManagement;
