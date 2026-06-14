export interface TestCreateRequest {
  ciclo: number;
  genero: string;
  facultad: string;
  practicasprepro: string; // "Sí" o "No"
}

export interface Test {
  id: number;
  user_id: number;
  ciclo: number;
  genero: string;
  facultad: string;
  practicasprepro: string;
  status: 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  total_responses: number;
  expected_responses: number;
}

export interface TestDetail extends Test {
  responses: TestResponseDetail[];
}

export interface TestResponseSubmit {
  question_id: number;
  answer_value: string;
}

export interface TestResponseBatch {
  responses: TestResponseSubmit[];
}

export interface TestResponseDetail {
  id: number;
  question_id: number;
  question_key: string;
  question_text: string;
  answer_value: string;
  answered_at: string;
}

export interface TestResult {
  id: number;
  test_id: number;
  prediction: 'SI' | 'N'; // S = burnout detectado, N = sin burnout
  probability: number;
  model_version: string;
  predicted_at: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  category?: string;
  for_positive_result: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BurnoutStats {
  total_completed_tests: number;
  burnout_yes: number;
  burnout_no: number;
  burnout_yes_percentage: number;
  burnout_no_percentage: number;
}

export interface UserTestReport {
  user_id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  tests: {
    test_id: number;
    completed_at: string;
    prediction: 'SI' | 'N';
    probability: number;
    ciclo: number;
    genero: string;
    facultad: string;
    practicasprepro: string;
  }[];
}
