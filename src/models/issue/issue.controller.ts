import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { issueService } from "./issue.service";
import { decodeToken } from "../../utils/jwt";
import type { EIssueStatus, EIssueType, IUpdateIssue } from "./issue.interface";

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

  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to create user',
      data: error.message
    })
  }
}

const getAllIssue = async (req: Request, res: Response) => {
  try {
    const sort = (req.query.sort as string) === 'oldest' ? 'oldest' : 'newest';
    const type = req.query.type as any;
    const status = req.query.status as any;

    const formattedData = await issueService.getIssueFromDB({ sort, status, type });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Issues retrieved successfully",
      data: formattedData
    });

  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to get issues',
      data: error.message
    })
  }
}

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const id = req.params.id

    const issue = await issueService.getSingleIssueFromDB(id as string)

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Issues retrieved successfully",
      data: issue
    });

  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to get issues',
      data: error.message
    })
  }
}

const updateIssue = async (req: Request, res: Response) => {
  try {
    const payload: IUpdateIssue = req.body
    const jwtToken = req.headers.authorization
    const id = req.params.id
    const result = await issueService.updateIssueIntoDB(id as string, jwtToken as string, payload)
    if (result?.rowCount === 1) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Issues updated successfully",
        data: result?.rows[0]
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to update issue",
      });

  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to update issues',
      data: error.message
    })
  }
}

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const result = await issueService.deleteSingleIssueFromDB(id as string)

    if (result.rowCount === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Issue not found"
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Issue deleted successfully"
    });


  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: 'Failed to delete issues',
      data: error.message
    })
  }
}

export const issueController = {
  createIssue, getAllIssue, getSingleIssue, updateIssue, deleteIssue
}