import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload folder if not exists
const UPLOADS_FOLDER = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter (optional, can customize per field)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "pmcCertificate") {
    // Accept only PDF or Word
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
      file.mimetype === "application/msword" // .doc
    ) {
      cb(null, true);
    } else {
      cb(new Error("PMC certificate must be a PDF or Word document"), false);
    }
  } else {
    // For future files, accept any type (or customize)
    cb(null, true);
  }
};

// Max file size (optional, e.g., 5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
