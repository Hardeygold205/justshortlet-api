import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  updateMeSchema,
  getUserByIdSchema,
  getUsersSchema,
} from "../../schema/user.schema.js";
import {
  getMe,
  getOneUser,
  getUsers,
  updateMe,
  deleteMe,
} from "./user.controller.js";

const router = express.Router();

router.get("/", validate(getUsersSchema), getUsers);
router.get("/me", authenticate, getMe);
router.get("/:userId", validate(getUserByIdSchema), getOneUser);

router.patch("/me", authenticate, validate(updateMeSchema), updateMe);
router.delete("/me", authenticate, deleteMe);

export default router;
