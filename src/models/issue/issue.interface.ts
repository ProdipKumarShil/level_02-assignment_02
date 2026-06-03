import type { IPUser } from "../auth/auth.interface";

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
  id: number;
  title: string;
  description: string;
  type: EIssueType;
  status: EIssueStatus;
  reporter_id: number;
  created_at?: string;
  updated_at?: string;
}

export type IPIssue = Omit<IIssue, 'id' | 'status' | 'reporter_id' | 'created_at' | 'updated_at'>

export interface IQueryFilters {
  sort: 'newest' | 'oldest';
  type?: EIssueType;
  status?: EIssueStatus;
}

export type TReporter = Omit<IPUser, 'email'>

export type TIssue = Omit<IIssue, 'reporter_id'> & {
  reporter: TReporter
}