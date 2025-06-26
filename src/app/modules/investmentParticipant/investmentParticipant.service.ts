import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TInvestmentParticipant } from "./investmentParticipant.interface";
import moment from "moment";
import { InvestmentParticipant } from "./investmentParticipant.model";
import { InvestmentParticipantSearchableFields } from "./investmentParticipant.constant";
import { Transaction } from "../transactions/transactions.model";





const createInvestmentParticipantIntoDB = async (payload: TInvestmentParticipant) => {
  try {
    const { investorId, investmentId, amount, agentCommissionRate } = payload;

    if (!investorId || !investmentId || !amount) {
      throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    // Check for existing participant
    let participant = await InvestmentParticipant.findOne({ investorId, investmentId });

    if (!participant) {
      // Create new participant
      participant = await InvestmentParticipant.create({
        ...payload,
        totalDue: amount,
        totalPaid: 0,
        agentCommissionRate,
        status: "active",
      });

      // ➕ Create MonthlyTransaction
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

      const newTransaction = await Transaction.create({
        month: currentMonth,
        investorId,
        investmentId,
        profit: 0, // Initially no profit
        monthlyTotalDue: amount,
        monthlyTotalPaid: 0,
        status: "due",
        paymentLog: [
          {
            transactionType: "investment",
            dueAmount: amount,
            paidAmount: 0,
            status: "due",
            note: "Initial Investment Successfully Created",
          },
        ],
        logs: [
          {
            type: "investmentAdded",
            message: `Initial investment of £${amount} added.`,
            metadata: {
              investorId,
              investmentId,
              amount,
            },
          },
        ],
      });
    } else {
      // Update participant by incrementing amount and due
      participant.amount += amount;
      participant.totalDue += amount;
      await participant.save();

     
    }

    return participant;
  } catch (error: any) {
    console.error("Error in createOrUpdateInvestmentParticipant:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create or update InvestmentParticipant"
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
    throw new AppError(httpStatus.NOT_FOUND, "InvestmentParticipant not found");
  }

  const hasAmount = payload.amount !== undefined && typeof payload.amount === 'number';
  const hasAgentCommissionRate = payload.agentCommissionRate !== undefined;

  if (hasAmount && hasAgentCommissionRate) {
    investmentParticipant.amount = payload.amount!;
    investmentParticipant.totalDue = payload.amount!;
  } else if (hasAmount) {
    investmentParticipant.amount += payload.amount!;
    investmentParticipant.totalDue += payload.amount!;
  }

  for (const key in payload) {
    if (key !== 'amount') {
      (investmentParticipant as any)[key] = (payload as any)[key];
    }
  }

  // ✅ Handle project closure logic
  if (
    payload.status === "block" &&
    payload.totalDue === 0 &&
    payload.totalPaid &&
    payload.totalPaid > 0
  ) {
    const investmentId = investmentParticipant.investmentId;
    const investorId = investmentParticipant.investorId;

    // Set amount to 0 if payload.amount exists (even if it's 0)
    if (payload.amount !== undefined) {
      investmentParticipant.amount = 0;
    }

    // Find and update MonthlyTransaction
    const monthlyTransaction = await Transaction.findOne({
      investmentId: investmentId,
      investorId: investorId,
    });

    if (monthlyTransaction) {
      monthlyTransaction.monthlyTotalPaid = payload.totalPaid;
      monthlyTransaction.status = "paid";

      monthlyTransaction.paymentLog.push({
        transactionType: "closeProject",
        dueAmount: 0,
        paidAmount: payload.totalPaid,
        status: "paid",
        note: "Project closed and fully paid",
      });

      monthlyTransaction.logs.push({
        type: "projectClosed",
        message: `Project closed. Total paid: ${payload.totalPaid}`,
        metadata: {
          investmentId: investmentId,
          investorId: investorId,
        },
      });

      await monthlyTransaction.save();
    }
  }

  const result = await investmentParticipant.save();
  return result;
};




export const InvestmentParticipantServices = {
  getAllInvestmentParticipantFromDB,
  getSingleInvestmentParticipantFromDB,
  updateInvestmentParticipantIntoDB,
  createInvestmentParticipantIntoDB,
  
};
