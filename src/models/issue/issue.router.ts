import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router()

router.post('/', auth(USER_ROLE.contributor) ,issueController.createIssue)
router.get('/', issueController.getAllIssue)
router.put('/:id', issueController.updateIssue)
router.get('/:id', issueController.getSingleIssue)
router.delete('/:id', auth(USER_ROLE.maintainer), issueController.deleteIssue)

export const issueRouters = router