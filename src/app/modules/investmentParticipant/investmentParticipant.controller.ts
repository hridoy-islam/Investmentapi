import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { InvestmentParticipantServices } from "./investmentParticipant.service";

const InvestmentParticipantCreate = catchAsync(async (req, res) => {
  const result = await InvestmentParticipantServices.createInvestmentParticipantIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "InvestmentParticipant created successfully",
    data: result,
  });
});



const getAllInvestmentParticipant: RequestHandler = catchAsync(async (req, res) => {
  const result = await InvestmentParticipantServices.getAllInvestmentParticipantFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "InvestmentParticipant retrived succesfully",
    data: result,
  });
});
const getSingleInvestmentParticipant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvestmentParticipantServices.getSingleInvestmentParticipantFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "InvestmentParticipant is retrieved succesfully",
    data: result,
  });
});

const updateInvestmentParticipant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InvestmentParticipantServices.updateInvestmentParticipantIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "InvestmentParticipant is updated succesfully",
    data: result,
  });
});

export const InvestmentParticipantControllers = {
  getAllInvestmentParticipant,
  getSingleInvestmentParticipant,
  updateInvestmentParticipant,
  InvestmentParticipantCreate,
};
