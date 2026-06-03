import { pool } from "../../db";
import { EIssueStatus, type IIssue, type IPIssue, type IQueryFilters, type TIssue } from "./issue.interface";

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

const getIssueFromDB = async (filters: IQueryFilters) => {
  const { sort, status, type } = filters;

  let queryText = `SELECT * FROM issues WHERE 1=1`;
  const queryValues: (string | number)[] = [];
  let paramCounter = 1;

  if (type) {
    queryText += ` AND type = $${paramCounter}`;
    queryValues.push(type);
    paramCounter++;
  }

  if (status) {
    queryText += ` AND status = $${paramCounter}`;
    queryValues.push(status);
    paramCounter++;
  }

  const orderByDirection = sort === 'oldest' ? 'ASC' : 'DESC';
  queryText += ` ORDER BY created_at ${orderByDirection}`;

  const allIssuesResult = await pool.query(queryText, queryValues);
  const issues: IIssue[] = allIssuesResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const uniqueReporterIds = Array.from(new Set(issues.map(issue => Number(issue.reporter_id))));

  const placeholders = uniqueReporterIds.map((_, index) => `$${index + 1}`).join(", ");
  const userQueryText = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;

  const userResult = await pool.query(userQueryText, uniqueReporterIds);
  const users = userResult.rows;

  const userMap = new Map<number, { id: number; name: string; role: string }>();
  users.forEach(user => userMap.set(user.id, user));

  const formattedIssues = issues.map(issue => {
    const reporterDetails = userMap.get(Number(issue.reporter_id)) || null;

    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterDetails,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });

  return formattedIssues;

}

const getSingleIssueFromDB = async (id: string) => {
  const issueData = await pool.query(`
    SELECT * FROM issues WHERE id = $1;
  `, [id])

  const issueResult = issueData.rows[0]

  if(!issueResult){
    throw new Error('Issue not found!')
  }
  
  const userId = issueResult.reporter_id

  const reporterData = await pool.query(`
    SELECT * FROM users WHERE id = $1;
  `, [userId])

  const reporterResult = reporterData.rows[0]

  // console.log({ issueResult, reporterResult })
  
  const issue: TIssue = {
    id: issueResult.id,
    title: issueResult.title,
    description: issueResult.title,
    type: issueResult.title,
    status: issueResult.status,
    reporter: {
      id: reporterResult.id,
      name: reporterResult.name,
      role: reporterResult.role
    },
    created_at: issueResult.created_at,
    updated_at: issueResult.updated_at
  }

  return issue
}

export const issueService = {
  createIssueIntoDB, getIssueFromDB, getSingleIssueFromDB
}