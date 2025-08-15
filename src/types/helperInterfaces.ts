export interface TestCase {
  input: string;
  expected_output: string;
}

export interface Question {
  id: string;
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases?: TestCase[];
  hidden_testcases?: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface CreateQuestionRequestLocal {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options?: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases?: TestCase[];
  hidden_testcases?: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
}

export interface UpdateTestPayload {
  title: string;
  description: string;
  maxMarks: number;
  passingMarks: number;
  durationInMinutes: number;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
}

export interface QuestionFormData {
  question_text: string;
  type: "MCQ" | "DESCRIPTIVE" | "CODE";
  marks: number;
  options: { text: string; correct: boolean }[];
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases: TestCase[];
  hidden_testcases: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
}

export const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
];
