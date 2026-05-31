export enum EIssueType{
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request'
}

export enum EIssueStatus{
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved'
}

export interface IIssue {
  id: string;
  title: string;
  description: string;
  type: EIssueType;
  status: EIssueStatus;
  reporter_id: string;
  created_at?: string;
  updated_at?: string;
}