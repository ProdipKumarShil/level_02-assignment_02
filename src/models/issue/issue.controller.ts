import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result = await 
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'User created successfully',
      data: result
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