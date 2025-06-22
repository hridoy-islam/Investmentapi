import express from "express";

import auth from "../../middlewares/auth";
import { NotificationControllers } from "./notification.controller";

const router = express.Router();
// Route to create a notification
router.post(
  "/",
  auth("admin", "agent", "investor"),
  NotificationControllers.createNotification
);

// Route to fetch notifications for a user
router.get("/:userId", NotificationControllers.getNotifications);

// Route to mark a notification as read
router.patch(
  "/:notificationId/read",
  auth("admin", "agent", "investor"),
  NotificationControllers.markAsRead
);
router.patch(
  "/readall",
  auth("admin", "agent", "investor"),
  NotificationControllers.markAllAsRead
);

export const NotificationsRoutes = router;
