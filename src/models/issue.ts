export interface Issue {
  _id: string;
  issuetype: string;
  summary: string;
  description: string;
  parentKey?: string | null;
  key: string;
}