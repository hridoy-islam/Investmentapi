import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { InvestmentParticipant } from "./InvestmentParticipant.model";
import { InvestmentParticipantSearchableFields } from "./InvestmentParticipant.constant";
import { TInvestmentParticipant } from "./investmentParticipant.interface";


const createInvestmentParticipantIntoDB = async (payload: TInvestmentParticipant) => {
  try {
    const result = await InvestmentParticipant.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createInvestmentParticipantParticipantIntoDB:", error);

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
    .filter()
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
  const result = await InvestmentParticipant.findById(id);
  return result;
};

const updateInvestmentParticipantIntoDB = async (
  id: string,
  payload: Partial<TInvestmentParticipant>
) => {
  const investmentParticipant = await InvestmentParticipant.findById(id);

  if (!investmentParticipant) {
    throw new AppError(httpStatus.NOT_FOUND, "InvestmentParticipant not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await InvestmentParticipant.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const InvestmentParticipantServices = {
  getAllInvestmentParticipantFromDB,
  getSingleInvestmentParticipantFromDB,
  updateInvestmentParticipantIntoDB,
  createInvestmentParticipantIntoDB,
};
