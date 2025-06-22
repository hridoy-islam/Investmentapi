import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TInvestmentParticipant } from "./investmentParticipant.interface";
import moment from "moment";
import { InvestmentParticipant } from "./investmentParticipant.model";
import { InvestmentParticipantSearchableFields } from "./investmentParticipant.constant";





const createInvestmentParticipantIntoDB = async (payload: TInvestmentParticipant) => {
  try {
    const result = await InvestmentParticipant.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in create InvestmentParticipantParticipantIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Category"
    );
  }
};

const getAllInvestmentParticipantFromDB = async (query: Record<string, unknown>) => {
  const InvestmentParticipantQuery = new QueryBuilder(
    InvestmentParticipant.find().populate("investorId").populate("investmentId"),
    query
  )
    .search(InvestmentParticipantSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await InvestmentParticipantQuery.countTotal();
  const result = await InvestmentParticipantQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleInvestmentParticipantFromDB = async (id: string) => {
  const result = await InvestmentParticipant.findById(id).populate("investorId").populate("investmentId");
  return result;
};

const updateInvestmentParticipantIntoDB = async (
  id: string,
    payload: Partial<TInvestmentParticipant>
  ) => {
    const investmentParticipant = await InvestmentParticipant.findById(id);
  
    if (!investmentParticipant) {
      throw new AppError(httpStatus.NOT_FOUND, "investment not found");
    }
  
   
    const result = await InvestmentParticipant.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  
};





export const InvestmentParticipantServices = {
  getAllInvestmentParticipantFromDB,
  getSingleInvestmentParticipantFromDB,
  updateInvestmentParticipantIntoDB,
  createInvestmentParticipantIntoDB,
  
};
