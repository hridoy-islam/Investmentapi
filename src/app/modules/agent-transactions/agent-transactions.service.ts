import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TAgentTransaction } from "./agent-transactions.interface";
import moment from "moment";
import { AgentTransaction } from "./agent-transactions.model";
import { AgentTransactionSearchableFields } from "./agent-transactions.constant";
import { InvestmentParticipant } from "../investmentParticipant/investmentParticipant.model";
import { AgentCommission } from "../agent-commission/agent-commission.model";







const createAgentTransactionIntoDB = async (payload: TAgentTransaction) => {
  try {
    const result = await AgentTransaction.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createAgentTransactionParticipantIntoDB:", error);

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

const getAllAgentTransactionFromDB = async (query: Record<string, unknown>) => {
  const AgentTransactionQuery = new QueryBuilder(
    AgentTransaction.find().populate("investorId").populate("investmentId"),
    query
  )
    .search(AgentTransactionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await AgentTransactionQuery.countTotal();
  const result = await AgentTransactionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleAgentTransactionFromDB = async (id: string) => {
  const result = await AgentTransaction.findById(id).populate("investorId").populate("investmentId");
  return result;
};


const updateAgentTransactionIntoDB = async (
  id: string,
  payload: Partial<{
    paidAmount: number;
    note: string;
  }>
) => {
  const agentTransaction = await AgentTransaction.findById(id);
  if (!agentTransaction) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent Transaction not found");
  }

   if (
     payload.paidAmount !== undefined &&
     payload.paidAmount > agentTransaction.commissionDue
   ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Paid amount cannot exceed the remaining due`
      );
    }

  // Handle payment update
  if (payload.paidAmount && payload.paidAmount > 0) {
    const paidAmount = Number(payload.paidAmount.toFixed(2));
    const newCommissionPaid = Number((agentTransaction.commissionPaid + paidAmount).toFixed(2));
    const newCommissionDue = Math.max(0, Number((agentTransaction.commissionDue - paidAmount).toFixed(2)));

    // Determine updated status
    let updatedStatus: "due" | "partial" | "paid" = "due";
    if (newCommissionPaid >= agentTransaction.commissionDue) {
      updatedStatus = "paid";
    } else if (newCommissionPaid > 0) {
      updatedStatus = "partial";
    }

    // Add payment log entry
    agentTransaction.paymentLog.push({
      transactionType: "commissionPayment",
      dueAmount: agentTransaction.commissionDue,
      paidAmount,
      status: updatedStatus,
      note: payload.note || "",
    });

    // Apply updates to transaction
    agentTransaction.commissionPaid = newCommissionPaid;
    agentTransaction.commissionDue = newCommissionDue;
    agentTransaction.status = updatedStatus;

    // Also update AgentCommissionSummary
    await AgentCommission.findOneAndUpdate(
      {
        agentId: agentTransaction.agentId,
        investorId: agentTransaction.investorId,
      },
      {
        $inc: {
          totalCommissionPaid: paidAmount,
          totalCommissionDue: -paidAmount,
        },
      },
      { new: true, upsert: true } // create if not exists
    );
  }

  // Save updates
  await agentTransaction.save();

  return agentTransaction;
};





export const AgentTransactionServices = {
  getAllAgentTransactionFromDB,
  getSingleAgentTransactionFromDB,
  updateAgentTransactionIntoDB,
  createAgentTransactionIntoDB,

};
