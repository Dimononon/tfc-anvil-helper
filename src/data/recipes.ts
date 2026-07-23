export interface TfcRecipe {
  id: string;
  input: string;
  result: string;
  inputName?: string;
  resultName?: string;
  tier: number;
  rules: string[];
}

