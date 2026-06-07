
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/models/auth/auth.route.ts
import { Router } from "express";

// src/models/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTIONSTRING,
  access_secret: process.env.ACCESS_SECRET,
  refresh_secret: process.env.REFRESH_SECRET,
  access_expire: process.env.ACCESS_EXPIRE,
  refresh_expire: process.env.REFRESH_EXPIRE
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
        type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.log("db/index.ts", error);
  }
};

// src/models/auth/auth.service.ts
import "jsonwebtoken";

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var signToken = (payload) => {
  console.log(payload);
  const accessToken = jwt.sign(payload, config_default.access_secret, {
    expiresIn: "1d"
  });
  return accessToken;
};
var decodeToken = (payload) => {
  return jwt.verify(payload, config_default.access_secret);
};

// src/models/auth/auth.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
    INSERT INTO users(name, email, password, role)
    VALUES($1, $2, $3, COALESCE($4, 'contributor'))
    RETURNING *
  `, [name, email, hashPassword, role]);
  delete result.rows[0].password;
  return result;
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
    SELECT * FROM users WHERE email=$1  
  `, [email]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (!matchedPassword) {
    throw new Error("Invalid Credentials");
  }
  const accessToken = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  const { password: _, ...userWithoutPassword } = user;
  const loginInfo = {
    token: accessToken,
    user: userWithoutPassword
  };
  return loginInfo;
};
var authService = {
  createUserIntoDB,
  loginUser
};

// src/models/auth/auth.controller.ts
import { StatusCodes } from "http-status-codes";
var userSignup = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message
    });
  }
};
var userLogin = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.message
    });
  }
};
var authController = { userSignup, userLogin };

// src/models/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.userSignup);
router.post("/login", authController.userLogin);
var authRoutes = router;

// src/models/issue/issue.router.ts
import { Router as Router2 } from "express";

// src/models/issue/issue.controller.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";

// src/models/issue/issue.service.ts
var createIssueIntoDB = async (id, payload) => {
  const { title, description, type } = payload;
  const issue = {
    title,
    description,
    type,
    reporter_id: id,
    status: "open" /* OPEN */
  };
  const result = await pool.query(`
    INSERT INTO issues(title, description, type, status, reporter_id)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *
  `, [issue.title, issue.description, issue.type, issue.status, issue.reporter_id]);
  console.log(issue);
  return result;
};
var getIssueFromDB = async (filters) => {
  const { sort, status, type } = filters;
  let queryText = `SELECT * FROM issues WHERE 1=1`;
  const queryValues = [];
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
  const orderByDirection = sort === "oldest" ? "ASC" : "DESC";
  queryText += ` ORDER BY created_at ${orderByDirection}`;
  const allIssuesResult = await pool.query(queryText, queryValues);
  const issues = allIssuesResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const uniqueReporterIds = Array.from(new Set(issues.map((issue) => Number(issue.reporter_id))));
  const placeholders = uniqueReporterIds.map((_, index) => `$${index + 1}`).join(", ");
  const userQueryText = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;
  const userResult = await pool.query(userQueryText, uniqueReporterIds);
  const users = userResult.rows;
  const userMap = /* @__PURE__ */ new Map();
  users.forEach((user) => userMap.set(user.id, user));
  const formattedIssues = issues.map((issue) => {
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
};
var getSingleIssueFromDB = async (id) => {
  const issueData = await pool.query(`
    SELECT * FROM issues WHERE id = $1;
  `, [id]);
  const issueResult = issueData.rows[0];
  if (!issueResult) {
    throw new Error("Issue not found!");
  }
  const userId = issueResult.reporter_id;
  const reporterData = await pool.query(`
    SELECT * FROM users WHERE id = $1;
  `, [userId]);
  const reporterResult = reporterData.rows[0];
  const issue = {
    id: issueResult.id,
    title: issueResult.title,
    description: issueResult.description,
    type: issueResult.type,
    status: issueResult.status,
    reporter: {
      id: reporterResult.id,
      name: reporterResult.name,
      role: reporterResult.role
    },
    created_at: issueResult.created_at,
    updated_at: issueResult.updated_at
  };
  return issue;
};
var deleteSingleIssueFromDB = async (id) => {
  const result = await pool.query(`
    DELETE FROM issues WHERE id=$1  
  `, [id]);
  return result;
};
var updateIssueIntoDB = async (id, jwtToken, payload) => {
  const { title, description, type } = payload;
  const updateData = async () => {
    const result = await pool.query(`
      UPDATE issues
      SET
      title=COALESCE($1, title),
      description=COALESCE($2, description),
      type=COALESCE($3, type)
      WHERE id=$4 RETURNING *
      `, [title, description, type, id]);
    return result;
  };
  const decodedUser = decodeToken(jwtToken);
  const issueResult = await pool.query(`
      SELECT * FROM issues WHERE id=$1
    `, [id]);
  const issueData = issueResult.rows[0];
  if (!issueData) {
    throw new Error("Issue does not exist!");
  }
  const userResult = await pool.query(`
    SELECT * FROM users WHERE id=$1
    `, [decodedUser.id]);
  const userData = userResult.rows[0];
  if (!userData) {
    throw new Error("User does not exist!");
  }
  if (decodedUser.role === "maintainer") {
    return await updateData();
  }
  if (decodedUser.role === "contributor") {
    const reportId = issueData.reporter_id;
    const reportUserResult = await pool.query(`
      SELECT * FROM users WHERE id=$1  
    `, [reportId]);
    const reportUserData = reportUserResult.rows[0];
    if (reportUserData.email === decodedUser.email && reportUserData.status == "open") {
      return await updateData();
    } else {
      throw new Error("Invalid contributor or status!");
    }
  }
};
var issueService = {
  createIssueIntoDB,
  getIssueFromDB,
  getSingleIssueFromDB,
  deleteSingleIssueFromDB,
  updateIssueIntoDB
};

// src/models/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decodedUser = decodeToken(token);
    const result = await issueService.createIssueIntoDB(decodedUser.id, req.body);
    res.status(StatusCodes2.CREATED).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create issue"
    });
  } catch (error) {
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to create user",
      data: error.message
    });
  }
};
var getAllIssue = async (req, res) => {
  try {
    const sort = req.query.sort === "oldest" ? "oldest" : "newest";
    const type = req.query.type;
    const status = req.query.status;
    const formattedData = await issueService.getIssueFromDB({ sort, status, type });
    res.status(StatusCodes2.OK).json({
      success: true,
      message: "Issues retrieved successfully",
      data: formattedData
    });
  } catch (error) {
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to get issues",
      data: error.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const issue = await issueService.getSingleIssueFromDB(id);
    res.status(StatusCodes2.OK).json({
      success: true,
      message: "Issues retrieved successfully",
      data: issue
    });
  } catch (error) {
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to get issues",
      data: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const payload = req.body;
    const jwtToken = req.headers.authorization;
    const id = req.params.id;
    const result = await issueService.updateIssueIntoDB(id, jwtToken, payload);
    if (result?.rowCount === 1) {
      res.status(StatusCodes2.OK).json({
        success: true,
        message: "Issues updated successfully",
        data: result?.rows[0]
      });
    }
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update issue"
    });
  } catch (error) {
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to update issues",
      data: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await issueService.deleteSingleIssueFromDB(id);
    if (result.rowCount === 0) {
      return res.status(StatusCodes2.NOT_FOUND).json({
        success: false,
        message: "Issue not found"
      });
    }
    res.status(StatusCodes2.OK).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    res.status(StatusCodes2.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to delete issues",
      data: error.message
    });
  }
};
var issueController = {
  createIssue,
  getAllIssue,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      console.log(roles);
      const token = req.headers.authorization;
      if (!token) {
        return res.status(StatusCodes3.UNAUTHORIZED).json({
          status: false,
          message: "Unauthorize access"
        });
      }
      const decodeTokenData = decodeToken(token);
      const userData = await pool.query(`
      SELECT * FROM users WHERE email=$1  
    `, [decodeTokenData.email]);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return res.status(StatusCodes3.NOT_FOUND).json({
          status: false,
          message: "User not found"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(StatusCodes3.FORBIDDEN).json({
          status: false,
          message: "Forbidden, This role has no access"
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  maintainer: "maintainer",
  contributor: "contributor"
};

// src/models/issue/issue.router.ts
var router2 = Router2();
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);
router2.get("/", issueController.getAllIssue);
router2.put("/:id", issueController.updateIssue);
router2.get("/:id", issueController.getSingleIssue);
router2.delete("/:id", auth_default(USER_ROLE.maintainer, USER_ROLE.contributor), issueController.deleteIssue);
var issueRouters = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (error, req, res, next) => {
  res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: `Server is running`
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRouters);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server is running on ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map