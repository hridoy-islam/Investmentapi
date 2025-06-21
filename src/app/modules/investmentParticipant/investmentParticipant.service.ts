import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TInvestmentParticipant } from "./investmentParticipant.interface";
import moment from "moment";
import { InvestmentParticipant } from "./investmentParticipant.model";
import { InvestmentParticipantSearchableFields } from "./investmentParticipant.constant";


export const runMonthlyProfitGeneration = async () => {
  try {
    const participants = await InvestmentParticipant.find({ status: "active" });

    const currentDate = moment();
    const currentMonth = currentDate.format("YYYY-MM");

    for (const participant of participants) {
      const existingRecord = participant.monthlyProfits.find(
        (record) => record.month === currentMonth
      );

      if (!existingRecord) {
        const monthlyProfit = (participant.amount * participant.rate) / 100;

        const newRecord = {
          month: currentMonth,
          profit: monthlyProfit,
          paymentLog: [
            {
              dueAmount: monthlyProfit,
              paidAmount: 0,
              status: "due"
            }
          ]
        };

        participant.monthlyProfits.push(newRecord);
        participant.totalDue += monthlyProfit;
      }

      // Recalculate totalPaid and update status in each paymentLog entry
      let totalPaid = 0;

      participant.monthlyProfits.forEach((entry) => {
        entry.paymentLog.forEach((log) => {
          // Update status based on payment
          if (log.paidAmount >= log.dueAmount) {
            log.status = "paid";
          } else if (log.paidAmount > 0) {
            log.status = "partial";
          } else {
            log.status = "due";
          }

          totalPaid += log.paidAmount;
        });
      });

      participant.totalPaid = totalPaid;

      await participant.save();
    }

    console.log("Monthly profit update completed.");
  } catch (error) {
    console.error("Error in monthly profit generation:", error);
  }
};



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
  runMonthlyProfitGeneration
};
