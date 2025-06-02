/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { UserControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";

const router = express.Router();
router.get(
  "/",
  // auth("admin", "agent", "investor"),
  UserControllers.getAllUser
);
router.get(
  "/:id",
  auth("admin", "agent", "investor"),
  UserControllers.getSingleUser
);

router.patch(
  "/:id",
  auth("admin", "agent", "investor"),
  UserControllers.updateUser
);


export const UserRoutes = router;
