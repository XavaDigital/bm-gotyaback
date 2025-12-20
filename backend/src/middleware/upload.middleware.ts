import multer from "multer";

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// Logo upload configuration
export const uploadLogo = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Only PNG, JPG, and SVG files are allowed."
        )
      );
    }
    
    cb(null, true);
  },
});

