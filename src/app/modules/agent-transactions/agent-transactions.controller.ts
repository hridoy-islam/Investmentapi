import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AgentTransactionServices } from "./agent-transactions.service";

const AgentTransactionCreate = catchAsync(async (req, res) => {
  const result = await AgentTransactionServices.createAgentTransactionIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentTransaction created successfully",
    data: result,
  });
});



const getAllAgentTransaction: RequestHandler = catchAsync(async (req, res) => {
  const result = await AgentTransactionServices.getAllAgentTransactionFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentTransaction retrived succesfully",
    data: result,
  });
});
const getSingleAgentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AgentTransactionServices.getSingleAgentTransactionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentTransaction is retrieved succesfully",
    data: result,
  });
});

const updateAgentTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AgentTransactionServices.updateAgentTransactionIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentTransaction is updated succesfully",
    data: result,
  });
});

export const AgentTransactionControllers = {
  getAllAgentTransaction,
  getSingleAgentTransaction,
  updateAgentTransaction,
  AgentTransactionCreate,

};
