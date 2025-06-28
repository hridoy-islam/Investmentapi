import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";

import { Investment } from "./investment.model";
import { TInvestment } from "./investment.interface";
import { InvestmentSearchableFields } from "./investment.constant";
import { Transaction } from "../transactions/transactions.model";
import { InvestmentParticipant } from "../investmentParticipant/investmentParticipant.model";
import moment from "moment";
import { User } from "../user/user.model";
import mongoose from "mongoose";
import { AgentCommission } from "../agent-commission/agent-commission.model";
import { AgentTransaction } from "../agent-transactions/agent-transactions.model";

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
  saleOperationId?: string;
};

export const updateInvestmentIntoDB = async (
  id: string,
  payload: TUpdateInvestmentPayload
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const investment = await Investment.findById(id).session(session);
    if (!investment) {
      throw new AppError(httpStatus.NOT_FOUND, "Investment not found");
    }

    if (payload?.saleAmount && isNaN(payload.saleAmount)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid saleAmount");
    }

    const updates: Partial<TInvestment> = {};
    let logMessage = "";
    let updatedAmountRequired: number | undefined;

    // Handle amountRequired update
    if (payload.amountRequired) {
      const previousAmount = investment.amountRequired;
      updatedAmountRequired = Number(
        (previousAmount + payload.amountRequired).toFixed(2)
      );
      updates.amountRequired = updatedAmountRequired;
      logMessage = `Investment Raised capital £${updatedAmountRequired}`;
    }

    // Handle saleAmount and profit distribution
    if (payload.saleAmount) {
      const saleAmount = Number(payload.saleAmount.toFixed(2));
      const initialInvestment = Number(investment.amountRequired.toFixed(2));
      const grossProfit = Number((saleAmount - initialInvestment).toFixed(2));

      const adminCostRate = investment.adminCost || 0;
      const adminCost = Number(
        (grossProfit * (adminCostRate / 100)).toFixed(2)
      );
      const netProfit = Number((grossProfit - adminCost).toFixed(2));

      const currentMonth = moment().format("YYYY-MM");
      const saleOperationId = new mongoose.Types.ObjectId().toString();

      const participants = await InvestmentParticipant.find({
        investmentId: id,
        status: "active",
      }).session(session);

      const now = new Date();
      const globalLogs = [
        {
          type: "saleDeclared",
          message: `CMV / SALE £${payload.saleAmount}`,
          metadata: {
            amount: payload.saleAmount,
            refId: saleOperationId,
          },
          createdAt: new Date(now.getTime() + 1),
        },
        {
          type: "saleDeclared",
          message: `Profit for sale -- Gross Profit £${grossProfit}`,
          metadata: {
            amount: grossProfit,
            saleAmount: payload.saleAmount,
            refId: saleOperationId,
          },
          createdAt: new Date(now.getTime() + 2),
        },
        {
          type: "adminCostDeclared",
          message: `Admin Cost ${adminCostRate}% for ${investment.title} -- Net Profit £${adminCost}`,
          metadata: {
            investmentId: id,
            adminCostRate,
            amount: adminCost,
            cmv: payload.saleAmount,
            refId: saleOperationId,
          },
          createdAt: new Date(now.getTime() + 3),
        },
        {
          type: "grossProfit",
          message: `Net Profit Allocated for ${investment.title}: £${netProfit}`,
          metadata: { amount: netProfit },
          createdAt: new Date(now.getTime() + 4),
        },
      ];

      let globalTransaction = await Transaction.findOne({
        investmentId: id,
        investorId: null,
        month: currentMonth,
      }).session(session);

      if (globalTransaction) {
        globalTransaction.logs.push(...globalLogs);
      } else {
        globalTransaction = new Transaction({
          investmentId: id,
          investorId: null,
          month: currentMonth,
          profit: 0,
          monthlyTotalDue: 0,
          monthlyTotalPaid: 0,
          monthlyTotalAgentDue: 0,
          monthlyTotalAgentPaid: 0,
          status: "due",
          logs: globalLogs,
        });
      }
      await globalTransaction.save({ session });

      const participantUpdates = [];
      const investorTxnPromises = [];
      const agentTxnPromises = [];

      for (const participant of participants) {
        const investorSharePercent =
          (100 * participant.amount) / initialInvestment;
        const investorNetProfit = Number(
          ((netProfit * investorSharePercent) / 100).toFixed(2)
        );

        participant.totalDue = Number(
          (participant.totalDue + investorNetProfit).toFixed(2)
        );

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
        participantUpdates.push(participant.save({ session }));

        const investor = await User.findById(participant.investorId)
          .session(session)
          .lean();
        const investorName = investor?.name || "Investor";

        const profitLog = {
          type: "profitDistributed",
          message: `Profit Distributed to ${investorName} from net profit £${netProfit} x ${investorSharePercent.toFixed(
            2
          )}% = £${investorNetProfit}`,
          metadata: {
            netProfit,
            amount: investorNetProfit,
            sharePercentage: investorSharePercent,
            investorName,
          },
          createdAt: new Date(),
        };

        let investorTxn = await Transaction.findOne({
          investmentId: id,
          investorId: participant.investorId,
          month: currentMonth,
        }).session(session);

        if (!investorTxn) {
          investorTxn = new Transaction({
            investmentId: id,
            investorId: participant.investorId,
            month: currentMonth,
            profit: investorNetProfit,
            monthlyTotalDue: investorNetProfit,
            monthlyTotalPaid: 0,
            monthlyTotalAgentDue: 0,
            monthlyTotalAgentPaid: 0,
            status: "due",
            logs: [profitLog],
          });
        } else {
          investorTxn.logs.push(profitLog);
          investorTxn.profit = Number(
            (investorTxn.profit + investorNetProfit).toFixed(2)
          );
          investorTxn.monthlyTotalDue = Number(
            (investorTxn.monthlyTotalDue + investorNetProfit).toFixed(2)
          );
        }
        investorTxnPromises.push(investorTxn.save({ session }));

        // ✅ Agent Commission Logic
        if (investor?.agent && participant.agentCommissionRate > 0) {
          const agent = await User.findById(investor.agent)
            .session(session)
            .lean();
          if (agent) {
            const agentCommissionRate = participant.agentCommissionRate;
            const commissionBase =
              grossProfit * (investorSharePercent / 100) - investorNetProfit;
            const commission = Number(
              (commissionBase * (agentCommissionRate / 100)).toFixed(2)
            );

            if (commission > 0) {
              const commissionLog = {
                type: "commissionCalculated",
                message: `Commission distributed to agent ${agent.name} (${agentCommissionRate}%) for ${investorName}: £${commission}`,
                metadata: {
                  agentId: agent._id,
                  agentName: agent.name,
                  investorId: investor._id,
                  investorName,
                  amount: commission,
                  investorSharePercent,
                  investorNetProfit,
                  refId: saleOperationId,
                },
                createdAt: new Date(),
              };

              let agentTxn = await AgentTransaction.findOne({
                investmentId: id,
                investorId: investor._id,
                agentId: agent._id,
                month: currentMonth,
              }).session(session);

              if (!agentTxn) {
                agentTxn = new AgentTransaction({
                  investmentId: id,
                  investorId: investor._id,
                  agentId: agent._id,
                  month: currentMonth,
                  commissionDue: commission,
                  commissionPaid: 0,
                  status: "due",
                  logs: [commissionLog],
                  paymentLog: [],
                });
              } else {
                agentTxn.logs.push(commissionLog);
                agentTxn.commissionDue = Number(
                  (agentTxn.commissionDue + commission).toFixed(2)
                );

                if (agentTxn.commissionPaid >= agentTxn.commissionDue) {
                  agentTxn.status = "paid";
                } else if (agentTxn.commissionPaid > 0) {
                  agentTxn.status = "partial";
                } else {
                  agentTxn.status = "due";
                }
              }

              agentTxnPromises.push(agentTxn.save({ session }));

              let agentSummary = await AgentCommission.findOne({
                agentId: agent._id,
                investorId: investor._id,
              }).session(session);

              if (!agentSummary) {
                agentSummary = new AgentCommission({
                  agentId: agent._id,
                  investorId: investor._id,
                  totalCommissionDue: commission,
                  totalCommissionPaid: 0,
                });
              } else {
                agentSummary.totalCommissionDue = Number(
                  (agentSummary.totalCommissionDue + commission).toFixed(2)
                );
              }

              await agentSummary.save({ session });
            }
          }
        }
      }

      await Promise.all([
        ...participantUpdates,
        ...investorTxnPromises,
        ...agentTxnPromises,
      ]);
    }

    if (logMessage) {
      const currentMonth = moment().format("YYYY-MM");
      const logEntry = {
        type: "investmentUpdated",
        message: logMessage,
        metadata: { updatedAmountRequired },
        createdAt: new Date(),
      };

      let logTransaction = await Transaction.findOne({
        investmentId: id,
        investorId: null,
        month: currentMonth,
      }).session(session);

      if (logTransaction) {
        logTransaction.logs.push(logEntry);
      } else {
        logTransaction = new Transaction({
          investmentId: id,
          investorId: null,
          month: currentMonth,
          profit: 0,
          monthlyTotalDue: 0,
          monthlyTotalPaid: 0,

          status: "due",
          logs: [logEntry],
        });
      }
      await logTransaction.save({ session });
    }

    const updatableFields = [
      "status",
      "saleAmount",
      "adminCost",
      "details",
      "title",
      "image",
      "documents",
    ];
    for (const field of updatableFields) {
      if (field in payload && payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    const updatedInvestment = await Investment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      session,
    });

    await session.commitTransaction();
    return updatedInvestment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
export const InvestmentServices = {
  getAllInvestmentFromDB,
  getSingleInvestmentFromDB,
  updateInvestmentIntoDB,
  createInvestmentIntoDB,
};
