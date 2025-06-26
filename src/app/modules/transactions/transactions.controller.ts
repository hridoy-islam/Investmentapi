import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { TransactionServices } from "./transactions.service";

const TransactionCreate = catchAsync(async (req, res) => {
  const result = await TransactionServices.createTransactionIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transaction created successfully",
    data: result,
  });
});



const getAllTransaction: RequestHandler = catchAsync(async (req, res) => {
  const result = await TransactionServices.getAllTransactionFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transaction retrived succesfully",
    data: result,
  });
});
const getSingleTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TransactionServices.getSingleTransactionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transaction is retrieved succesfully",
    data: result,
  });
});

const updateTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TransactionServices.updateTransactionIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transaction is updated succesfully",
    data: result,
  });
});

export const TransactionControllers = {
  getAllTransaction,
  getSingleTransaction,
  updateTransaction,
  TransactionCreate,

};
