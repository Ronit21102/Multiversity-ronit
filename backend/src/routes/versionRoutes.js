import express from "express";
import { versionController } from "../controllers/versionController.js";

const router = express.Router();

// Get version history for a document
router.get("/versions/:documentName", versionController.getVersionHistory);

// Get differences between versions
router.get(
  "/versions/:documentName/:versionId/diff",
  versionController.getVersionDiff
);

// Get version content
router.get(
  "/versions/:documentName/:versionId/content",
  versionController.getVersionContent
);

export { router as versionRoutes };
