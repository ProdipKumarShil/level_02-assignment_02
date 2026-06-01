import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { issueService } from "./issue.service";
import { decodeToken } from "../../utils/jwt";

const createIssue = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization

    const decodedUser = decodeToken(token as string)
    const result = await issueService.createIssueIntoDB(decodedUser.id, req.body)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Issue created successfully',
      data: result.rows[0]
    })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create issue'
    })


  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to create user',
      data: error.message
    })
  }
}

const getAllIssue = async (req: Request, res: Response) => {

}

const getSingleIssue = async (req: Request, res: Response) => {

}

const updateIssue = async (req: Request, res: Response) => {

}

const deleteIssue = async (req: Request, res: Response) => {

}

export const issueController = {
  createIssue, getAllIssue, getSingleIssue, updateIssue, deleteIssue
}