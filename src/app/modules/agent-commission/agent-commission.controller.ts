import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AgentCommissionServices } from "./agent-commission.service";

const AgentCommissionCreate = catchAsync(async (req, res) => {
  const result = await AgentCommissionServices.createAgentCommissionIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentCommission created successfully",
    data: result,
  });
});

const getAllAgentCommission: RequestHandler = catchAsync(async (req, res) => {
  const result = await AgentCommissionServices.getAllAgentCommissionFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentCommission retrived succesfully",
    data: result,
  });
});
const getSingleAgentCommission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AgentCommissionServices.getSingleAgentCommissionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentCommission is retrieved succesfully",
    data: result,
  });
});

const updateAgentCommission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AgentCommissionServices.updateAgentCommissionIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AgentCommission is updated succesfully",
    data: result,
  });
});

export const AgentCommissionControllers = {
  getAllAgentCommission,
  getSingleAgentCommission,
  updateAgentCommission,
  AgentCommissionCreate,
};
