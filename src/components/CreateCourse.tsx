import React, { useState, useEffect } from "react";
import { FaSave, FaPlus, FaTrash, FaSearch, FaUpload } from "react-icons/fa";
import { useCourseStore, CreateCourseData } from "@/store/courseStore";
import { useSession } from "next-auth/react";

interface CreateCourseProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

const CreateCourse: React.FC<CreateCourseProps> = ({ onCancel, onSuccess }) => {
  const { data: session } = useSession();
  const { batches, loading, error, fetchBatches, createCourse, clearError } =
    useCourseStore();

  const [formData, setFormData] = useState<CreateCourseData>({
    title: "",
    logo: "",
    start_date: "",
    end_date: "",
    batch_ids: [],
    is_public: false,
    instructor_name: "",
    overview: "",
    trainer_name: "",
    trainer_bio: "",
    trainer_avatar: "",
    trainer_linkedin: "",
    price: 0,
    duration: "",
    image: "",
    features: [],
    curriculum: [],
    prerequisites: [],
    tags: [],
    mode: "online",
    what_you_will_learn: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [inputFields, setInputFields] = useState({
    feature: "",
    curriculum: "",
    curriculumPoint: "",
    prerequisite: "",
    tag: "",
    learn: "",
  });
  const [batchSearch, setBatchSearch] = useState("");
  const [curriculumPoints, setCurriculumPoints] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [trainerAvatarFile, setTrainerAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const googleIdToken = (session as { id_token?: string })?.id_token;
        if (!googleIdToken) throw new Error("No Google ID token found");

        const adminToken = sessionStorage.getItem("adminToken");
        const instructorName = adminToken
          ? "Current User"
          : session?.user?.name || "Unknown";
        setFormData((prev) => ({
          ...prev,
          instructor_name: prev.instructor_name || instructorName,
          trainer_name: prev.trainer_name || instructorName,
        }));
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (session?.user) fetchProfile();
  }, [session]);

  useEffect(() => {
    if (session?.user)
      fetchBatches().catch((err) =>
        console.error("Failed to fetch batches:", err)
      );
  }, [session, fetchBatches]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Course title is required";
    if (!formData.start_date) newErrors.start_date = "Start date is required";
    if (!formData.end_date) newErrors.end_date = "End date is required";
    if (!formData.instructor_name.trim())
      newErrors.instructor_name = "Instructor name is required";
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.start_date) >= new Date(formData.end_date)
    ) {
      newErrors.end_date = "End date must be after start date";
    }
    if (!formData.is_public) {
      if (!formData.batch_ids?.length)
        newErrors.batch_ids =
          "At least one batch is required for private courses";
    } else {
      if (!formData.overview?.trim())
        newErrors.overview = "Overview is required for public courses";
      if (!formData.trainer_name?.trim())
        newErrors.trainer_name = "Trainer name is required for public courses";
      if (!formData.price)
        newErrors.price = "Price is required for public courses";
      if (!formData.duration?.trim())
        newErrors.duration = "Duration is required for public courses";
      if (!formData.features?.length)
        newErrors.features =
          "At least one feature is required for public courses";
      if (!formData.curriculum?.length)
        newErrors.curriculum =
          "At least one curriculum item is required for public courses";
      if (!formData.what_you_will_learn?.length)
        newErrors.what_you_will_learn =
          "At least one learning outcome is required for public courses";
    }
    if (logoFile && !["image/jpeg", "image/png"].includes(logoFile.type))
      newErrors.logo = "Logo must be a JPEG or PNG image";
    if (
      trainerAvatarFile &&
      !["image/jpeg", "image/png"].includes(trainerAvatarFile.type)
    )
      newErrors.trainer_avatar = "Trainer avatar must be a JPEG or PNG image";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "price"
          ? parseFloat(value) || 0
          : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo" | "trainer_avatar"
  ) => {
    const file = e.target.files?.[0] || null;
    if (field === "logo") {
      setLogoFile(file);
      if (errors.logo) setErrors((prev) => ({ ...prev, logo: "" }));
    } else {
      setTrainerAvatarFile(file);
      if (errors.trainer_avatar)
        setErrors((prev) => ({ ...prev, trainer_avatar: "" }));
    }
  };

  const handleBatchToggle = (batchId: string) => {
    setFormData((prev) => {
      const batchIds = prev.batch_ids.includes(batchId)
        ? prev.batch_ids.filter((id) => id !== batchId)
        : [...prev.batch_ids, batchId];
      return { ...prev, batch_ids: batchIds };
    });
    if (errors.batch_ids) setErrors((prev) => ({ ...prev, batch_ids: "" }));
  };

  const handleArrayInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInputFields((prev) => ({ ...prev, [name]: value }));
  };

  const addCurriculumPoint = () => {
    const point = inputFields.curriculumPoint.trim();
    if (!point) return;
    setCurriculumPoints((prev) => [...prev, point]);
    setInputFields((prev) => ({ ...prev, curriculumPoint: "" }));
  };

  const addArrayItem = (field: keyof typeof inputFields) => {
    if (field === "curriculum") {
      const title = inputFields.curriculum.trim();
      if (!title) return;
      if (curriculumPoints.length === 0) {
        setErrors((prev) => ({
          ...prev,
          curriculum: "At least one sub-item is required for a module",
        }));
        return;
      }
      const curriculumItem = [
        title,
        ...curriculumPoints.map((point) => `- ${point}`),
      ].join("\n");
      setFormData((prev) => ({
        ...prev,
        curriculum: [...(prev.curriculum ?? []), curriculumItem],
      }));
      setInputFields((prev) => ({
        ...prev,
        curriculum: "",
        curriculumPoint: "",
      }));
      setCurriculumPoints([]);
      if (errors.curriculum) setErrors((prev) => ({ ...prev, curriculum: "" }));
    } else {
      const value = inputFields[field].trim();
      if (!value) return;
      if (field === "learn") {
        setFormData((prev) => ({
          ...prev,
          what_you_will_learn: [...(prev.what_you_will_learn ?? []), value],
        }));
        if (errors["what_you_will_learn"])
          setErrors((prev) => ({ ...prev, what_you_will_learn: "" }));
      } else if (field === "feature") {
        setFormData((prev) => ({
          ...prev,
          features: [...(prev.features ?? []), value],
        }));
        if (errors.features) setErrors((prev) => ({ ...prev, features: "" }));
      } else if (field === "prerequisite") {
        setFormData((prev) => ({
          ...prev,
          prerequisites: [...(prev.prerequisites ?? []), value],
        }));
        if (errors.prerequisites)
          setErrors((prev) => ({ ...prev, prerequisites: "" }));
      } else if (field === "tag") {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags ?? []), value],
        }));
        if (errors.tags) setErrors((prev) => ({ ...prev, tags: "" }));
      }
      setInputFields((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const removeArrayItem = (field: keyof typeof inputFields, index: number) => {
    if (field === "learn") {
      setFormData((prev) => ({
        ...prev,
        what_you_will_learn: (prev.what_you_will_learn ?? []).filter(
          (_, i) => i !== index
        ),
      }));
    } else if (field === "feature") {
      setFormData((prev) => ({
        ...prev,
        features: (prev.features ?? []).filter((_, i) => i !== index),
      }));
    } else if (field === "curriculum") {
      setFormData((prev) => ({
        ...prev,
        curriculum: (prev.curriculum ?? []).filter((_, i) => i !== index),
      }));
    } else if (field === "prerequisite") {
      setFormData((prev) => ({
        ...prev,
        prerequisites: (prev.prerequisites ?? []).filter((_, i) => i !== index),
      }));
    } else if (field === "tag") {
      setFormData((prev) => ({
        ...prev,
        tags: (prev.tags ?? []).filter((_, i) => i !== index),
      }));
    }
  };

  const removeCurriculumPoint = (index: number) => {
    setCurriculumPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      // Prepare the course data as a plain object
      const courseData: CreateCourseData = {
        ...formData,
        logo: logoFile ? "" : formData.logo, // handle file upload separately if needed
        trainer_avatar: trainerAvatarFile ? "" : formData.trainer_avatar, // handle file upload separately if needed
      };

      await createCourse(courseData);
      setFormData({
        title: "",
        logo: "",
        start_date: "",
        end_date: "",
        batch_ids: [],
        is_public: false,
        instructor_name: formData.instructor_name,
        overview: "",
        trainer_name: formData.trainer_name,
        trainer_bio: "",
        trainer_avatar: "",
        trainer_linkedin: "",
        price: 0,
        duration: "",
        image: "",
        features: [],
        curriculum: [],
        prerequisites: [],
        tags: [],
        mode: "online",
        what_you_will_learn: [],
      });
      setBatchSearch("");
      setInputFields({
        feature: "",
        curriculum: "",
        curriculumPoint: "",
        prerequisite: "",
        tag: "",
        learn: "",
      });
      setCurriculumPoints([]);
      setLogoFile(null);
      setTrainerAvatarFile(null);
      if (onSuccess) onSuccess();
      else alert("Course created successfully!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      alert(`Failed to create course: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderArrayInput = (field: keyof typeof inputFields, label: string) => {
    let arrayValue: string[] = [];
    let errorValue: string | undefined;
    if (field === "learn") {
      arrayValue = formData.what_you_will_learn ?? [];
      errorValue = errors["what_you_will_learn"];
    } else if (field === "feature") {
      arrayValue = formData.features ?? [];
      errorValue = errors.features;
    } else if (field === "curriculum") {
      arrayValue = formData.curriculum ?? [];
      errorValue = errors.curriculum;
    } else if (field === "prerequisite") {
      arrayValue = formData.prerequisites ?? [];
      errorValue = errors.prerequisites;
    } else if (field === "tag") {
      arrayValue = formData.tags ?? [];
      errorValue = errors.tags;
    }

    const isCurriculum = field === "curriculum";

    if (isCurriculum) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                name="curriculum"
                value={inputFields.curriculum}
                onChange={handleArrayInputChange}
                className={`flex-1 rounded-md border ${
                  errorValue ? "border-red-300" : "border-gray-300"
                } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                placeholder="Enter module title, e.g., Module 1: React Native Fundamentals"
                disabled={submitting}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                name="curriculumPoint"
                value={inputFields.curriculumPoint}
                onChange={handleArrayInputChange}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                placeholder="Add sub-item, e.g., Setting up development environment"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={addCurriculumPoint}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={submitting}
              >
                <FaPlus className="h-4 w-4" />
              </button>
            </div>
            {curriculumPoints.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Sub-items:</p>
                <ul className="space-y-1">
                  {curriculumPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm"
                    >
                      <span>- {point}</span>
                      <button
                        type="button"
                        onClick={() => removeCurriculumPoint(index)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={submitting}
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => addArrayItem(field)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={
                submitting ||
                !inputFields.curriculum ||
                curriculumPoints.length === 0
              }
            >
              <FaPlus className="h-4 w-4 mr-1" />
              Add Module
            </button>
          </div>
          {errorValue && <p className="text-sm text-red-600">{errorValue}</p>}
          <ul className="space-y-2">
            {arrayValue.map((item, index) => (
              <li key={index} className="rounded-md bg-gray-50 p-3 text-sm">
                <div className="flex items-start justify-between">
                  <div className="whitespace-pre-line">
                    {item.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={
                          line.startsWith("-") ? "ml-4" : "font-medium"
                        }
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeArrayItem(field, index)}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    disabled={submitting}
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name={field}
            value={inputFields[field]}
            onChange={handleArrayInputChange}
            className={`flex-1 rounded-md border ${
              errorValue ? "border-red-300" : "border-gray-300"
            } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
            placeholder={`Add ${label.toLowerCase()}`}
            disabled={submitting}
          />
          <button
            type="button"
            onClick={() => addArrayItem(field)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={submitting}
          >
            <FaPlus className="h-4 w-4" />
          </button>
        </div>
        {errorValue && <p className="text-sm text-red-600">{errorValue}</p>}
        <ul className="space-y-2">
          {arrayValue.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-md bg-gray-50 p-3 text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeArrayItem(field, index)}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                disabled={submitting}
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(batchSearch.toLowerCase())
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-lg">
        <div className="border-b border-gray-200 bg-indigo-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-indigo-700">
                Create Course
              </h2>
            </div>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`mt-1 w-full rounded-md border ${
                      errors.title ? "border-red-300" : "border-gray-300"
                    } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                    placeholder="Enter course title"
                    disabled={submitting}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course Logo
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="flex-1 cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">
                      <span className="flex items-center gap-2">
                        <FaUpload className="h-4 w-4" />
                        {logoFile
                          ? logoFile.name
                          : "Choose an image (JPEG/PNG)"}
                      </span>
                      <input
                        type="file"
                        name="logo"
                        accept="image/jpeg,image/png"
                        onChange={(e) => handleFileChange(e, "logo")}
                        className="hidden"
                        disabled={submitting}
                      />
                    </label>
                  </div>
                  {errors.logo && (
                    <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className={`mt-1 w-full rounded-md border ${
                      errors.start_date ? "border-red-300" : "border-gray-300"
                    } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                    disabled={submitting}
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className={`mt-1 w-full rounded-md border ${
                      errors.end_date ? "border-red-300" : "border-gray-300"
                    } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                    disabled={submitting}
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.end_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Instructor Name *
                  </label>
                  <input
                    type="text"
                    name="instructor_name"
                    value={formData.instructor_name}
                    onChange={handleInputChange}
                    className={`mt-1 w-full rounded-md border ${
                      errors.instructor_name
                        ? "border-red-300"
                        : "border-gray-300"
                    } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                    placeholder="Enter instructor name"
                    disabled={submitting}
                  />
                  {errors.instructor_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.instructor_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mode
                  </label>
                  <select
                    name="mode"
                    value={formData.mode}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    disabled={submitting}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      disabled={submitting}
                    />
                    Make this course public
                  </label>
                </div>
                {!formData.is_public && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Batches *
                    </label>
                    <div className="relative mt-1">
                      <div className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={batchSearch}
                          onChange={(e) => setBatchSearch(e.target.value)}
                          className="ml-2 flex-1 border-none text-sm focus:outline-none disabled:bg-gray-100"
                          placeholder="Search batches..."
                          disabled={loading || submitting}
                        />
                      </div>
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
                      {filteredBatches.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No batches found
                        </p>
                      ) : (
                        filteredBatches.map((batch) => (
                          <button
                            key={batch.id}
                            type="button"
                            onClick={() => handleBatchToggle(batch.id)}
                            className={`mb-2 flex w-full items-center justify-between rounded-md p-3 text-sm transition-colors ${
                              formData.batch_ids.includes(batch.id)
                                ? "bg-indigo-50 border-indigo-200"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            } border disabled:opacity-50`}
                            disabled={loading || submitting}
                          >
                            <span className="font-medium">{batch.name}</span>
                            <input
                              type="checkbox"
                              checked={formData.batch_ids.includes(batch.id)}
                              readOnly
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </button>
                        ))
                      )}
                    </div>
                    {errors.batch_ids && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.batch_ids}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {formData.is_public && (
              <div className="space-y-6">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">
                    Public Course Details
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Overview *
                      </label>
                      <textarea
                        name="overview"
                        value={formData.overview}
                        onChange={handleInputChange}
                        className={`mt-1 w-full rounded-md border ${
                          errors.overview ? "border-red-300" : "border-gray-300"
                        } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                        placeholder="Enter course overview"
                        rows={4}
                        disabled={submitting}
                      />
                      {errors.overview && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.overview}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trainer Name *
                      </label>
                      <input
                        type="text"
                        name="trainer_name"
                        value={formData.trainer_name}
                        onChange={handleInputChange}
                        className={`mt-1 w-full rounded-md border ${
                          errors.trainer_name
                            ? "border-red-300"
                            : "border-gray-300"
                        } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                        placeholder="Enter trainer name"
                        disabled={submitting}
                      />
                      {errors.trainer_name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.trainer_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trainer Bio
                      </label>
                      <textarea
                        name="trainer_bio"
                        value={formData.trainer_bio}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        placeholder="Enter trainer bio"
                        rows={3}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trainer Avatar
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <label className="flex-1 cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed">
                          <span className="flex items-center gap-2">
                            <FaUpload className="h-4 w-4" />
                            {trainerAvatarFile
                              ? trainerAvatarFile.name
                              : "Choose an image (JPEG/PNG)"}
                          </span>
                          <input
                            type="file"
                            name="trainer_avatar"
                            accept="image/jpeg,image/png"
                            onChange={(e) =>
                              handleFileChange(e, "trainer_avatar")
                            }
                            className="hidden"
                            disabled={submitting}
                          />
                        </label>
                      </div>
                      {errors.trainer_avatar && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.trainer_avatar}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trainer LinkedIn URL
                      </label>
                      <input
                        type="url"
                        name="trainer_linkedin"
                        value={formData.trainer_linkedin}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        placeholder="https://linkedin.com/in/trainer"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (INR) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price || ""}
                        onChange={handleInputChange}
                        className={`mt-1 w-full rounded-md border ${
                          errors.price ? "border-red-300" : "border-gray-300"
                        } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                        placeholder="Enter price"
                        disabled={submitting}
                        min="0"
                      />
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.price}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Duration *
                      </label>
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className={`mt-1 w-full rounded-md border ${
                          errors.duration ? "border-red-300" : "border-gray-300"
                        } px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100`}
                        placeholder="e.g., 12 weeks"
                        disabled={submitting}
                      />
                      {errors.duration && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.duration}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Course Image URL
                      </label>
                      <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        placeholder="https://example.com/image.jpg"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
                {renderArrayInput("feature", "Features *")}
                {renderArrayInput("curriculum", "Curriculum *")}
                {renderArrayInput("prerequisite", "Prerequisites")}
                {renderArrayInput("tag", "Tags")}
                {renderArrayInput("learn", "What You Will Learn *")}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={submitting || loading}
              >
                <FaSave className="h-4 w-4" />
                {submitting ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;
