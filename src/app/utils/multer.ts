import multer from "multer";
import path from "path";
import fs from "fs";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, process.cwd() + "/uploads/");
//   },
//   filename: function (req, file, cb) {
//     return cb(
//       null,
//       `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
//     );
//   },
// });

// export const upload = multer({ storage: storage });


// import multer from "multer";

// // Configure multer to store files in memory (instead of disk storage)
// const storage = multer.memoryStorage();

// export const upload = multer({ storage: storage });








// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/\s+/g, "_").replace(ext, "");
    const fileName = `${safeName}_${Date.now()}${ext}`;

    // Schedule deletion after 1 minute
    const filePath = path.join(uploadDir, fileName);
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log(`Deleted temporary file: ${filePath}`);
        }
      });
    }, 60 * 1000); // 1 minute

    cb(null, fileName);
  },
});

export const upload = multer({ storage });
