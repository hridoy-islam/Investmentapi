import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { BankServices } from "./bank.service";

const BankCreate = catchAsync(async (req, res) => {
  const result = await BankServices.createBankIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bank created successfully",
    data: result,
  });
});

const getAllBank: RequestHandler = catchAsync(async (req, res) => {
  const result = await BankServices.getAllBankFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bank retrived succesfully",
    data: result,
  });
});
const getSingleBank = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BankServices.getSingleBankFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bank is retrieved succesfully",
    data: result,
  });
});

const updateBank = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BankServices.updateBankIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bank is updated succesfully",
    data: result,
  });
});

export const BankControllers = {
  getAllBank,
  getSingleBank,
  updateBank,
  BankCreate,
};
