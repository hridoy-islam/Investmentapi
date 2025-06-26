import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";

import { Investment } from "./investment.model";
import { TInvestment } from "./investment.interface";
import { InvestmentSearchableFields } from "./investment.constant";
import { Transaction } from "../transactions/transactions.model";
import { InvestmentParticipant } from "../investmentParticipant/investmentParticipant.model";
import moment from "moment";


const createInvestmentIntoDB = async (payload: TInvestment) => {
  try {
    const result = await Investment.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createInvestmentIntoDB:", error);

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

const getAllInvestmentFromDB = async (query: Record<string, unknown>) => {
  const InvestmentQuery = new QueryBuilder(Investment.find(), query)
    .search(InvestmentSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await InvestmentQuery.countTotal();
  const result = await InvestmentQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleInvestmentFromDB = async (id: string) => {
  const result = await Investment.findById(id);
  return result;
};

type TUpdateInvestmentPayload = Partial<TInvestment> & {
  saleAmount?: number;
  adminCostRate?: number;
};




const updateInvestmentIntoDB = async (
  id: string,
  payload: TUpdateInvestmentPayload
) => {
  // 1. Fetch the investment
  const investment = await Investment.findById(id);
  if (!investment) {
    throw new AppError(httpStatus.NOT_FOUND, "Investment not found");
  }

  const updates: Partial<TInvestment> = {};
  let logMessage = "";
  let updatedAmountRequired: number | undefined;

  // 2. Handle capital increase
  if (payload.amountRequired) {
    const previousAmount = investment.amountRequired;
    updatedAmountRequired = Number(
      (Number(previousAmount) + Number(payload.amountRequired)).toFixed(2)
    );
    updates.amountRequired = updatedAmountRequired;

    logMessage = `Increased project capital from £${previousAmount} to £${updatedAmountRequired}`;
  }

  // 3. Handle profit distribution if a saleAmount is provided
  if (payload.saleAmount) {
    const saleAmount = Number(Number(payload.saleAmount).toFixed(2));
    const initialInvestment = Number(Number(investment.amountRequired).toFixed(2));
    const grossProfit = Number((saleAmount - initialInvestment).toFixed(2));

    const adminCostRate = payload.adminCostRate || 0;
    const adminCost = Number((grossProfit * (adminCostRate / 100)).toFixed(2));
    const netProfit = Number((grossProfit - adminCost).toFixed(2));

    const currentMonth = moment().format("YYYY-MM");

    const participants = await InvestmentParticipant.find({ investmentId: id });

    const transactionPromises = participants.map(async (participant) => {
      const rate = (100 * participant.amount) / initialInvestment;
      const investorNetProfit = Number(((netProfit * rate) / 100).toFixed(2));

      // Add profit to totalDue
      participant.totalDue = Number(
        (participant.totalDue + investorNetProfit).toFixed(2)
      );

      // Track investment and last update month
      const investmentMonth = moment(participant.createdAt).format("YYYY-MM");
      const lastUpdateMonth = participant.amountLastUpdatedAt
        ? moment(participant.amountLastUpdatedAt).format("YYYY-MM")
        : null;

      const shouldUpdateAmount =
        currentMonth !== investmentMonth && currentMonth !== lastUpdateMonth;

      if (shouldUpdateAmount) {
        participant.amount = Number(participant.totalDue.toFixed(2));
        participant.amountLastUpdatedAt = new Date();
      }

      const profitLog = {
        type: "profitDistributed",
        message: `Distributed profit for ${currentMonth}: ${rate.toFixed(
          2
        )}% of £${netProfit} = £${investorNetProfit}`,
        metadata: {
          netProfit,
          investorNetProfit,
          sharePercentage: rate,
        },
      };

      let existingTransaction = await Transaction.findOne({
        investmentId: id,
        investorId: participant.investorId,
        month: currentMonth,
      });

      if (existingTransaction) {
        existingTransaction.logs.push(profitLog);
        existingTransaction.profit = Number(
          (existingTransaction.profit + investorNetProfit).toFixed(2)
        );
        existingTransaction.monthlyTotalDue = Number(
          (existingTransaction.monthlyTotalDue + investorNetProfit).toFixed(2)
        );
      } else {
        existingTransaction = new Transaction({
          investmentId: id,
          investorId: participant.investorId,
          month: currentMonth,
          profit: investorNetProfit,
          monthlyTotalDue: investorNetProfit,
          monthlyTotalPaid: 0,
          status: "due",
          logs: [profitLog],
        });
      }

      await existingTransaction.save();
      await participant.save();
    });

    await Promise.all(transactionPromises);
  }

  // 4. Save any investment-level updates (e.g., updated amountRequired)
  const updatedInvestment = await Investment.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!logMessage) return updatedInvestment;

  const log = {
    type: "investmentUpdated",
    message: logMessage,
    metadata: {
      previousAmount: investment.amountRequired,
      newAmount: updatedAmountRequired,
    },
  };

  const currentMonth = moment().format("YYYY-MM");

  const participants = await InvestmentParticipant.find({ investmentId: id });

  const transactionLogPromises = participants.map(async (participant) => {
    let existingTransaction = await Transaction.findOne({
      investmentId: id,
      investorId: participant.investorId,
      month: currentMonth,
    });

    if (existingTransaction) {
      existingTransaction.logs.push(log);
      existingTransaction.profit ||= 0;
      existingTransaction.monthlyTotalDue ||= 0;
      existingTransaction.monthlyTotalPaid ||= 0;
    } else {
      existingTransaction = new Transaction({
        investmentId: id,
        investorId: participant.investorId,
        month: currentMonth,
        profit: 0,
        monthlyTotalDue: 0,
        monthlyTotalPaid: 0,
        status: "due",
        logs: [log],
      });
    }

    await existingTransaction.save();
  });

  await Promise.all(transactionLogPromises);

  return updatedInvestment;
};





export const InvestmentServices = {
  getAllInvestmentFromDB,
  getSingleInvestmentFromDB,
  updateInvestmentIntoDB,
  createInvestmentIntoDB,
};
