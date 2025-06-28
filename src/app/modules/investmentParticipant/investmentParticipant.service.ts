import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TInvestmentParticipant } from "./investmentParticipant.interface";
import moment from "moment";
import { InvestmentParticipant } from "./investmentParticipant.model";
import { InvestmentParticipantSearchableFields } from "./investmentParticipant.constant";
import { Transaction } from "../transactions/transactions.model";
import { Investment } from "../investment/investment.model";
import mongoose from "mongoose";

const createInvestmentParticipantIntoDB = async (
  payload: TInvestmentParticipant
) => {
  try {
    const { investorId, investmentId, amount, agentCommissionRate } = payload;

    if (!investorId || !investmentId || !amount) {
      throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    // ✅ Get the investment/project
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      throw new AppError(httpStatus.NOT_FOUND, "Investment not found");
    }

    // ✅ Calculate total invested so far in this project
    const aggregation = await InvestmentParticipant.aggregate([
      {
        $match: {
          investmentId: new mongoose.Types.ObjectId(investmentId),
        },
      },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: "$amount" },
        },
      },
    ]);

    const totalInvestedSoFar = aggregation[0]?.totalInvested || 0;
    const remainingAmount =
      Number(investment.amountRequired) - totalInvestedSoFar;

    // ✅ Guard: Prevent over-investment
    if (amount > remainingAmount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Only £${remainingAmount} left to invest in this project`
      );
    }

    // Check if participant already exists
    let participant = await InvestmentParticipant.findOne({
      investorId,
      investmentId,
    });

    if (!participant) {
      // Create new participant
      participant = await InvestmentParticipant.create({
        ...payload,
        totalDue: amount,
        totalPaid: 0,
        agentCommissionRate,
        status: "active",
      });

      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

      await Transaction.create({
        month: currentMonth,
        investorId,
        investmentId,
        profit: 0,
        monthlyTotalDue: 0,
        monthlyTotalPaid: 0,
        status: "due",
        paymentLog: [
          {
            transactionType: "investment",
            dueAmount: amount,
            paidAmount: 0,
            status: "due",
            note: `Initial investment of £${amount} added.`,
            metadata: {
              investorId,
              investmentId,
              amount,
            },
          },
        ],
      });
    } else {
      // Updating an existing participant
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

const getAllInvestmentParticipantFromDB = async (
  query: Record<string, unknown>
) => {
  const InvestmentParticipantQuery = new QueryBuilder(
    InvestmentParticipant.find()
      .populate("investorId")
      .populate("investmentId"),
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
  const result = await InvestmentParticipant.findById(id)
    .populate("investorId")
    .populate("investmentId");
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

  const hasAmount =
    payload.amount !== undefined && typeof payload.amount === "number";
  const hasAgentCommissionRate = payload.agentCommissionRate !== undefined;

  // Guard: Check if adding amount would exceed project's amountRequired
  if (hasAmount) {
    const investment = await Investment.findById(
      investmentParticipant.investmentId
    );
    if (!investment) {
      throw new AppError(httpStatus.NOT_FOUND, "Investment not found");
    }

    // Get all participants for this investment
    const allParticipants = await InvestmentParticipant.find({
      investmentId: investmentParticipant.investmentId,
    });

    // Calculate current total invested
    const currentTotalInvested = allParticipants.reduce(
      (total, participant) => total + participant.amount,
      0
    );

    // Calculate what the new total would be if we update this participant
    const participantCurrentAmount = investmentParticipant.amount;
    const newTotalInvested =
      currentTotalInvested - participantCurrentAmount + payload.amount!;

    if (newTotalInvested > Number(investment.amountRequired)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot invest £${payload.amount}. It would exceed the required £${investment.amountRequired}. Current invested: £${currentTotalInvested}`
      );
    }
  }

  let previousAmount = investmentParticipant.amount;

  if (hasAmount && hasAgentCommissionRate) {
    investmentParticipant.amount = payload.amount!;
    investmentParticipant.totalDue = payload.amount!;
  } else if (hasAmount) {
    investmentParticipant.amount += payload.amount!;
    investmentParticipant.totalDue += payload.amount!;
  }

  if (hasAmount) {
    const updatedAmount = investmentParticipant.amount;

    const monthlyTransaction = await Transaction.findOne({
      investmentId: investmentParticipant.investmentId,
      investorId: investmentParticipant.investorId,
    });

    if (monthlyTransaction) {
      monthlyTransaction.logs.push({
        type: "investmentUpdated",
        message: `Investment amount updated from £${previousAmount} to £${updatedAmount}`,
        metadata: {
          previousAmount,
          updatedAmount,
          amount: payload.amount,
        },
      });

      await monthlyTransaction.save();
    }
  }

  for (const key in payload) {
    if (key !== "amount") {
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
