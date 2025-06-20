import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";

import { Bank } from "./bank.model";
import { TBank } from "./bank.interface";
import { BankSearchableFields } from "./bank.constant";


const createBankIntoDB = async (payload: TBank) => {
  try {
    const result = await Bank.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createBankIntoDB:", error);

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

const getAllBankFromDB = async (query: Record<string, unknown>) => {
  const BankQuery = new QueryBuilder(Bank.find(), query)
    .search(BankSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await BankQuery.countTotal();
  const result = await BankQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleBankFromDB = async (id: string) => {
  const result = await Bank.findById(id);
  return result;
};

const updateBankIntoDB = async (
  id: string,
  payload: Partial<TBank>
) => {
  const bank = await Bank.findById(id);

  if (!bank) {
    throw new AppError(httpStatus.NOT_FOUND, "Bank not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Bank.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const BankServices = {
  getAllBankFromDB,
  getSingleBankFromDB,
  updateBankIntoDB,
  createBankIntoDB,
};
