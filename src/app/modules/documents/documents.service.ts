import { Storage } from "@google-cloud/storage";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import fs from 'fs/promises'; 
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

import { User } from "../user/user.model";




// const storage = new Storage({
//   keyFilename: "./work.json",
//   projectId: "vast-pride-453709-n7",
// });
// const bucketName = "taskplanner"; 
// const bucket = storage.bucket(bucketName);

// const UploadDocumentToGCS = async (file: any, payload: any) => {
//   const { entityId, file_type,   } = payload;
//   try {
//     if (!file) throw new AppError(httpStatus.BAD_REQUEST, "No file provided");

//     const fileName = `${Date.now()}-${file.originalname}`;
//     const gcsFile = bucket.file(fileName);

//     await new Promise((resolve, reject) => {
//       const stream = gcsFile.createWriteStream({
//         metadata: { contentType: file.mimetype }, // Set metadata to determine file type
//       });

//       stream.on("error", (err) => {
//         console.error("Error during file upload:", err);
//         reject(err);
//       });

//       stream.on("finish", async () => {
//         try {
//           // Make the file publicly accessible
//           await gcsFile.makePublic();
//           resolve(true);
//         } catch (err) {
//           console.error("Error making the file public:", err);
//           reject(err);
//         }
//       });

//       // Send the file buffer to GCS
//       stream.end(file.buffer);
//     });

//     const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

//     // Check file type and determine where to save the file URL
//     if (file_type === "profile") {
//       const user = await User.findById(entityId);
//       if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

//       user.image = fileUrl; 
//       await user.save();


//       return { entityId, file_type, fileUrl };
//     }
//      else if(file_type === "groupDoc"){
      
//       return { entityId, file_type, fileUrl };
//     }
//      else if(file_type === "taskDoc"){
      
//       return { entityId, file_type, fileUrl };
//     }
     
//     // else if(file_type === "transaction"){
//     //   const transaction = await Transaction.findById(entityId);
//     //   if (!transaction) throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");

//     //   transaction.transactionDoc = fileUrl; 
//     //   await transaction.save();


//     //   return { entityId, file_type, fileUrl };
//     // }
//   } catch (error) {
//     console.error("File upload failed:", error);
//     throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
//   }
// };


interface UploadResult {
  originalName: string;
  textContent: string;
  filePath: string;
}

interface UploadResult {
  originalName: string;
  textContent: string;
  filePath: string;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }
    return data.text;
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to parse PDF: ' + (error instanceof Error ? error.message : 'Invalid PDF format')
    );
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Document appears to be empty');
    }
    return result.value;
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to parse Word document: ' + (error instanceof Error ? error.message : 'Invalid document format')
    );
  }
}

export async function uploadDocument(
  file: Express.Multer.File, 
  userId: string
): Promise<UploadResult> {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  const filePath = path.join(process.cwd(), 'uploads', file.filename);
  let textContent = '';

  try {
    // Verify file exists before processing
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError(httpStatus.BAD_REQUEST, 'File not found on server');
    }

    const buffer = await fs.readFile(filePath);

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      textContent = await extractTextFromPdf(buffer);
    } else if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword'
    ) {
      textContent = await extractTextFromDocx(buffer);
    } else {
      throw new AppError(httpStatus.BAD_REQUEST, 'Unsupported file type. Only PDF and Word documents are allowed');
    }

    return {
      originalName: file.originalname,
      textContent: textContent,
      filePath: filePath
    };
  } catch (error) {
    // Clean up the uploaded file if processing fails
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.error('Failed to delete file:', unlinkError);
    }

    // If error is already an AppError, rethrow it
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle specific parsing errors
    if (error instanceof Error && error.message.includes('PDF')) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to parse PDF file. The file may be corrupted.');
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to process document: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
export const UploadDocumentService = {
  // UploadDocumentToGCS,
  uploadDocument
};
