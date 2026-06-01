import { pool } from "../../db";
import { EIssueStatus, type IIssue, type IPIssue } from "./issue.interface";

const createIssueIntoDB = async (id: number, payload: IPIssue) => {
  const { title, description, type } = payload

  const issue: Omit<IIssue, 'id'> = {
    title: title,
    description: description,
    type: type,
    reporter_id: id,
    status: EIssueStatus.OPEN
  }
  const result = await pool.query(`
    INSERT INTO issues(title, description, type, status, reporter_id)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *
  `, [issue.title, issue.description, issue.type, issue.status, issue.reporter_id])
  console.log(issue)
  return result
}

export const issueService = {
  createIssueIntoDB
}