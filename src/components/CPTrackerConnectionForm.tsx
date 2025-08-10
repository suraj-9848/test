import React, { useState } from "react";
import {
  CPTrackerConnection,
  CPTrackerProfile,
  CPTrackerFormData,
  CPTrackerFormErrors,
} from "../types/cptracker";

interface Props {
  initialData: CPTrackerProfile | null;
  loading: boolean;
  onSubmit: (data: CPTrackerConnection, refresh?: boolean) => void;
  onCancel: () => void;
  className?: string;
}

const defaultPlatforms = ["leetcode", "codeforces", "codechef"];

const CPTrackerConnectionForm: React.FC<Props> = ({
  initialData,
  loading,
  onSubmit,
  onCancel,
}) => {
  // atcoder_username is required by type but not used in UI
  const [form, setForm] = useState<CPTrackerFormData>({
    leetcode_username: initialData?.leetcode_username || "",
    codeforces_username: initialData?.codeforces_username || "",
    codechef_username: initialData?.codechef_username || "",
    atcoder_username: initialData?.atcoder_username || "",
  });
  const [activePlatforms, setActivePlatforms] = useState<string[]>(
    initialData?.active_platforms || [],
  );
  const [errors, setErrors] = useState<CPTrackerFormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePlatformToggle = (platform: string) => {
    setActivePlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const validate = (): boolean => {
    const errs: CPTrackerFormErrors = {};
    // Add validation as needed
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, active_platforms: activePlatforms }, false);
  };

  const handleSaveAndRefresh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, active_platforms: activePlatforms }, true);
  };

  return (
    <form onSubmit={handleSubmit}>
      {defaultPlatforms.map((platform) => (
        <div key={platform} className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={activePlatforms.includes(platform)}
            onChange={() => handlePlatformToggle(platform)}
            disabled={loading}
            className="accent-blue-600"
          />
          <span className="w-28 font-medium">
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </span>
          <input
            type="text"
            name={`${platform}_username`}
            value={
              form[`${platform}_username` as keyof CPTrackerFormData] || ""
            }
            onChange={handleChange}
            placeholder={`${platform} username`}
            disabled={loading}
            className="border rounded px-2 py-1 flex-1"
          />
          {errors[`${platform}_username` as keyof CPTrackerFormErrors] && (
            <span className="text-red-500 text-xs">
              {errors[`${platform}_username` as keyof CPTrackerFormErrors]}
            </span>
          )}
        </div>
      ))}
      <div className="mt-6 flex gap-4 justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleSaveAndRefresh}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
        >
          Save & Refresh
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
      {errors.general && (
        <div className="text-red-500 mt-2">{errors.general}</div>
      )}
    </form>
  );
};

export default CPTrackerConnectionForm;
