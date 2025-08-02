import { useState, useCallback, useRef, useEffect } from "react";
import apiClient from "@/utils/axiosInterceptor";
import { API_ENDPOINTS } from "@/config/urls";

interface Question {
  id: string;
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  expectedWordCount?: number;
  codeLanguage?: string;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

interface CreateQuestionRequest {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options?: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
}

export const useQuestionManagement = (testId: string) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!testId) return;

    try {
      setLoading(true);
      setError("");

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.QUESTIONS.LIST(testId),
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000,
        },
      );

      if (response.data.success && Array.isArray(response.data.questions)) {
        setQuestions(response.data.questions);
      } else {
        setQuestions([]);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const errorMessage =
          err.response?.data?.details ||
          err.message ||
          "Failed to fetch questions";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const createQuestion = useCallback(
    async (questionData: CreateQuestionRequest): Promise<Question | null> => {
      if (!testId) return null;

      try {
        setLoading(true);
        setError("");

        const response = await apiClient.post(
          API_ENDPOINTS.INSTRUCTOR.QUESTIONS.CREATE(testId),
          questionData,
          {
            timeout: 15000,
          },
        );

        if (response.data.success && response.data.question) {
          const newQuestion = response.data.question;

          setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);

          return newQuestion;
        } else {
          throw new Error(response.data.error || "Failed to create question");
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.message ||
          "Failed to create question";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [testId],
  );

  //  Update question with immediate state update
  const updateQuestion = useCallback(
    async (
      questionId: string,
      questionData: Partial<CreateQuestionRequest>,
    ): Promise<Question | null> => {
      if (!testId || !questionId) return null;

      try {
        setLoading(true);
        setError("");

        const response = await apiClient.put(
          API_ENDPOINTS.INSTRUCTOR.QUESTIONS.UPDATE(testId, questionId),
          questionData,
          {
            timeout: 15000,
          },
        );

        if (response.data.success && response.data.question) {
          const updatedQuestion = response.data.question;

          // IMMEDIATELY update state for real-time feedback
          setQuestions((prevQuestions) =>
            prevQuestions.map((q) =>
              q.id === questionId ? updatedQuestion : q,
            ),
          );

          return updatedQuestion;
        } else {
          throw new Error(response.data.error || "Failed to update question");
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.message ||
          "Failed to update question";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [testId],
  );

  //  Delete question with immediate state update
  const deleteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      if (!testId || !questionId) return false;

      try {
        setLoading(true);
        setError("");

        const response = await apiClient.delete(
          API_ENDPOINTS.INSTRUCTOR.QUESTIONS.DELETE(testId, questionId),
          {
            timeout: 10000,
          },
        );

        if (response.data.success) {
          // IMMEDIATELY update state for real-time feedback
          setQuestions((prevQuestions) =>
            prevQuestions.filter((q) => q.id !== questionId),
          );

          return true;
        } else {
          throw new Error(response.data.error || "Failed to delete question");
        }
      } catch (err: any) {
        console.error(" FRONTEND DELETE ERROR:", err);
        const errorMessage =
          err.response?.data?.details ||
          err.response?.data?.error ||
          err.message ||
          "Failed to delete question";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [testId],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    setQuestions,
  };
};
