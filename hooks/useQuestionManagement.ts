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

  // FIXED: Fetch questions with proper error handling
  const fetchQuestions = useCallback(async () => {
    if (!testId) return;

    try {
      setLoading(true);
      setError("");

      // Cancel previous request if ongoing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      console.log(" FRONTEND - Fetching questions for test:", testId);

      const response = await apiClient.get(
        API_ENDPOINTS.INSTRUCTOR.TEST_QUESTIONS(testId),
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000, // 10 second timeout
        },
      );

      console.log(" FRONTEND - Fetched questions:", {
        count: response.data.questions?.length,
        success: response.data.success,
      });

      if (response.data.success && Array.isArray(response.data.questions)) {
        setQuestions(response.data.questions);
      } else {
        setQuestions([]);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(" FRONTEND - Fetch error:", err);
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

  // FIXED: Create question with immediate state update
  const createQuestion = useCallback(
    async (questionData: CreateQuestionRequest): Promise<Question | null> => {
      if (!testId) return null;

      try {
        setLoading(true);
        setError("");

        console.log(" FRONTEND CREATE - Sending data:", {
          testId,
          question_text_length: questionData.question_text?.length,
          type: questionData.type,
        });

        const response = await apiClient.post(
          API_ENDPOINTS.INSTRUCTOR.TEST_QUESTIONS(testId),
          questionData,
          {
            timeout: 15000, // 15 second timeout for create operations
          },
        );

        console.log(" FRONTEND CREATE - Response:", {
          success: response.data.success,
          questionId: response.data.question?.id,
        });

        if (response.data.success && response.data.question) {
          const newQuestion = response.data.question;

          // IMMEDIATELY update state for real-time feedback
          setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);

          return newQuestion;
        } else {
          throw new Error(response.data.error || "Failed to create question");
        }
      } catch (err: any) {
        console.error(" FRONTEND CREATE ERROR:", err);
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

  // FIXED: Update question with immediate state update
  const updateQuestion = useCallback(
    async (
      questionId: string,
      questionData: Partial<CreateQuestionRequest>,
    ): Promise<Question | null> => {
      if (!testId || !questionId) return null;

      try {
        setLoading(true);
        setError("");

        console.log(" FRONTEND UPDATE - Sending data:", {
          testId,
          questionId,
          question_text_length: questionData.question_text?.length,
        });

        const response = await apiClient.put(
          API_ENDPOINTS.INSTRUCTOR.TEST_QUESTION_BY_ID(testId, questionId),
          questionData,
          {
            timeout: 15000,
          },
        );

        console.log(" FRONTEND UPDATE - Response:", {
          success: response.data.success,
          questionId: response.data.question?.id,
        });

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
        console.error(" FRONTEND UPDATE ERROR:", err);
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

  // FIXED: Delete question with immediate state update
  const deleteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      if (!testId || !questionId) return false;

      try {
        setLoading(true);
        setError("");

        console.log(" FRONTEND DELETE - Deleting question:", {
          testId,
          questionId,
        });

        const response = await apiClient.delete(
          API_ENDPOINTS.INSTRUCTOR.TEST_QUESTION_BY_ID(testId, questionId),
          {
            timeout: 10000,
          },
        );

        console.log(" FRONTEND DELETE - Response:", {
          success: response.data.success,
        });

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
    setQuestions, // Allow manual state updates if needed
  };
};
