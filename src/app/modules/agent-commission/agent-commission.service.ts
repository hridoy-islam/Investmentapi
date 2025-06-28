import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";

import { AgentCommission } from "./agent-commission.model";
import { TAgentCommission } from "./agent-commission.interface";
import { AgentCommissionSearchableFields } from "./agent-commission.constant";


const createAgentCommissionIntoDB = async (payload: TAgentCommission) => {
  try {
    const result = await AgentCommission.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createAgentCommissionIntoDB:", error);

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

const getAllAgentCommissionFromDB = async (query: Record<string, unknown>) => {
  const AgentCommissionQuery = new QueryBuilder(AgentCommission.find(), query)
    .search(AgentCommissionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await AgentCommissionQuery.countTotal();
  const result = await AgentCommissionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleAgentCommissionFromDB = async (id: string) => {
  const result = await AgentCommission.findById(id);
  return result;
};

const updateAgentCommissionIntoDB = async (
  id: string,
  payload: Partial<TAgentCommission>
) => {
  const agentCommission = await AgentCommission.findById(id);

  if (!agentCommission) {
    throw new AppError(httpStatus.NOT_FOUND, "AgentCommission not found");
  }


  const result = await AgentCommission.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const AgentCommissionServices = {
  getAllAgentCommissionFromDB,
  getSingleAgentCommissionFromDB,
  updateAgentCommissionIntoDB,
  createAgentCommissionIntoDB,
};
