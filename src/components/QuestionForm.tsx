import React, { useState, useRef } from 'react';

interface TestCase {
  input: string;
  expected_output: string;
}

interface QuestionFormData {
  question_text: string;
  type: 'MCQ' | 'DESCRIPTIVE' | 'CODE';
  marks: number;
  options?: Array<{ text: string; correct: boolean }>;
  expectedWordCount?: number;
  codeLanguage?: string;
  constraints?: string;
  visible_testcases?: TestCase[];
  hidden_testcases?: TestCase[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
}

interface AdminQuestionFormProps {
  testId: string;
  batchId: string;
  courseId: string;
  onQuestionAdded: (question: any) => void;
  onCancel: () => void;
  initialData?: Partial<QuestionFormData>;
  isEditing?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'swift', label: 'Swift' },
  { value: 'typescript', label: 'TypeScript' },
];

const AdminQuestionForm: React.FC<AdminQuestionFormProps> = ({
  testId,
  batchId,
  courseId,
  onQuestionAdded,
  onCancel,
  initialData = {},
  isEditing = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: initialData.question_text || '',
    type: initialData.type || 'MCQ',
    marks: initialData.marks || 1,
    options: initialData.options || [
      { text: '', correct: false },
      { text: '', correct: false }
    ],
    expectedWordCount: initialData.expectedWordCount,
    codeLanguage: initialData.codeLanguage || 'javascript',
    constraints: initialData.constraints || '',
    visible_testcases: initialData.visible_testcases || [
      { input: '', expected_output: '' }
    ],
    hidden_testcases: initialData.hidden_testcases || [
      { input: '', expected_output: '' }
    ],
    time_limit_ms: initialData.time_limit_ms || 5000,
    memory_limit_mb: initialData.memory_limit_mb || 256,
  });

  const updateFormData = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Add question via API
      const response = await fetch(`/api/instructor/batches/${batchId}/courses/${courseId}/tests/${testId}/questions`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ questions: [formData] }),
      });

      if (!response.ok) {
        throw new Error('Failed to save question');
      }

      const result = await response.json();
      onQuestionAdded(result.data.questions[0]);
      
      // Reset form if adding new question
      if (!isEditing) {
        resetForm();
      }
    } catch (error) {
      console.error('Error saving question:', error);
      setUploadStatus({
        type: 'error',
        message: 'Failed to save question. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.question_text.trim()) {
      alert('Question text is required');
      return false;
    }

    if (formData.type === 'MCQ') {
      const hasCorrectOption = formData.options?.some(opt => opt.correct);
      if (!hasCorrectOption) {
        alert('At least one option must be marked as correct for MCQ');
        return false;
      }

      const hasEmptyOption = formData.options?.some(opt => !opt.text.trim());
      if (hasEmptyOption) {
        alert('All options must have text');
        return false;
      }
    }

    if (formData.type === 'CODE') {
      const hasEmptyVisible = formData.visible_testcases?.some(
        tc => !tc.input.trim() || !tc.expected_output.trim()
      );
      const hasEmptyHidden = formData.hidden_testcases?.some(
        tc => !tc.input.trim() || !tc.expected_output.trim()
      );

      if (hasEmptyVisible || hasEmptyHidden) {
        alert('All test cases must have input and expected output');
        return false;
      }
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      type: 'MCQ',
      marks: 1,
      options: [{ text: '', correct: false }, { text: '', correct: false }],
      expectedWordCount: undefined,
      codeLanguage: 'javascript',
      constraints: '',
      visible_testcases: [{ input: '', expected_output: '' }],
      hidden_testcases: [{ input: '', expected_output: '' }],
      time_limit_ms: 5000,
      memory_limit_mb: 256,
    });
  };

  const downloadDemoFile = (format: 'txt' | 'json') => {
    const demoContent = format === 'json' 
      ? JSON.stringify({
          visible_testcases: [
            { input: "5 3", expected_output: "8" },
            { input: "10 20", expected_output: "30" }
          ],
          hidden_testcases: [
            { input: "100 200", expected_output: "300" },
            { input: "-5 10", expected_output: "5" }
          ]
        }, null, 2)
      : `VISIBLE
INPUT:
5 3
OUTPUT:
8
INPUT:
10 20
OUTPUT:
30
HIDDEN
INPUT:
100 200
OUTPUT:
300
INPUT:
-5 10
OUTPUT:
5`;

    const blob = new Blob([demoContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo_testcases.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Question' : 'Add New Question'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {uploadStatus && (
        <div className={`mb-4 p-3 rounded-lg ${
          uploadStatus.type === 'success' ? 'bg-green-100 text-green-700' :
          uploadStatus.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {uploadStatus.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Question Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Question Type
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(['MCQ', 'DESCRIPTIVE', 'CODE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateFormData('type', type)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {type === 'MCQ' ? '☑️' : type === 'DESCRIPTIVE' ? '📝' : '💻'}
                  </div>
                  <div className="font-medium">
                    {type === 'MCQ' ? 'Multiple Choice' : 
                     type === 'DESCRIPTIVE' ? 'Descriptive' : 'Coding'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Question Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Text
          </label>
          <textarea
            value={formData.question_text}
            onChange={(e) => updateFormData('question_text', e.target.value)}
            placeholder="Enter your question here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Basic Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marks
            </label>
            <input
              type="number"
              min="1"
              value={formData.marks}
              onChange={(e) => updateFormData('marks', parseInt(e.target.value) || 1)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formData.type === 'DESCRIPTIVE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Word Count
              </label>
              <input
                type="number"
                min="1"
                value={formData.expectedWordCount || ''}
                onChange={(e) => updateFormData('expectedWordCount', parseInt(e.target.value) || undefined)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          )}
        </div>

        {/* MCQ Options */}
        {formData.type === 'MCQ' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div className="space-y-3">
              {formData.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={option.correct}
                    onChange={(e) => {
                      const newOptions = [...(formData.options || [])];
                      newOptions[index] = { ...option, correct: e.target.checked };
                      updateFormData('options', newOptions);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...(formData.options || [])];
                      newOptions[index] = { ...option, text: e.target.value };
                      updateFormData('options', newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {(formData.options?.length || 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = formData.options?.filter((_, i) => i !== index) || [];
                        updateFormData('options', newOptions);
                      }}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(formData.options || []), { text: '', correct: false }];
                  updateFormData('options', newOptions);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        {/* Coding Question Specific Fields */}
        {formData.type === 'CODE' && (
          <div className="space-y-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">Coding Question Settings</h3>
            
            {/* Language and Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programming Language
                </label>
                <select
                  value={formData.codeLanguage}
                  onChange={(e) => updateFormData('codeLanguage', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (ms)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="30000"
                  value={formData.time_limit_ms}
                  onChange={(e) => updateFormData('time_limit_ms', parseInt(e.target.value) || 5000)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Memory Limit (MB)
                </label>
                <input
                  type="number"
                  min="128"
                  max="1024"
                  value={formData.memory_limit_mb}
                  onChange={(e) => updateFormData('memory_limit_mb', parseInt(e.target.value) || 256)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Constraints */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Constraints
              </label>
              <textarea
                value={formData.constraints}
                onChange={(e) => updateFormData('constraints', e.target.value)}
                placeholder="e.g., 1 ≤ n ≤ 10^5, 1 ≤ arr[i] ≤ 10^9"
                className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Test Cases Upload */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Test Cases</h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => downloadDemoFile('txt')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Download Demo (.txt)
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDemoFile('json')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Download Demo (.json)
                  </button>
                </div>
              </div>

              {/* Quick Test Cases Input */}
              <div className="grid grid-cols-2 gap-6">
                {/* Visible Test Cases */}
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Visible Test Cases</h5>
                  {formData.visible_testcases?.map((testCase, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Input</label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) => {
                              const newTestCases = [...(formData.visible_testcases || [])];
                              newTestCases[index] = { ...testCase, input: e.target.value };
                              updateFormData('visible_testcases', newTestCases);
                            }}
                            className="w-full h-16 p-2 text-sm border rounded"
                            placeholder="Input"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Expected Output</label>
                          <textarea
                            value={testCase.expected_output}
                            onChange={(e) => {
                              const newTestCases = [...(formData.visible_testcases || [])];
                              newTestCases[index] = { ...testCase, expected_output: e.target.value };
                              updateFormData('visible_testcases', newTestCases);
                            }}
                            className="w-full h-16 p-2 text-sm border rounded"
                            placeholder="Output"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newTestCases = [...(formData.visible_testcases || []), { input: '', expected_output: '' }];
                      updateFormData('visible_testcases', newTestCases);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Visible Test Case
                  </button>
                </div>

                {/* Hidden Test Cases */}
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Hidden Test Cases</h5>
                  {formData.hidden_testcases?.map((testCase, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Input</label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) => {
                              const newTestCases = [...(formData.hidden_testcases || [])];
                              newTestCases[index] = { ...testCase, input: e.target.value };
                              updateFormData('hidden_testcases', newTestCases);
                            }}
                            className="w-full h-16 p-2 text-sm border rounded"
                            placeholder="Input"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Expected Output</label>
                          <textarea
                            value={testCase.expected_output}
                            onChange={(e) => {
                              const newTestCases = [...(formData.hidden_testcases || [])];
                              newTestCases[index] = { ...testCase, expected_output: e.target.value };
                              updateFormData('hidden_testcases', newTestCases);
                            }}
                            className="w-full h-16 p-2 text-sm border rounded"
                            placeholder="Output"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newTestCases = [...(formData.hidden_testcases || []), { input: '', expected_output: '' }];
                      updateFormData('hidden_testcases', newTestCases);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Hidden Test Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionForm;