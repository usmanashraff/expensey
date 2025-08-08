import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");

    // Get current year if not specified
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Get all incomes for the year
    const incomes = await prisma.income.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get all expenses for the year
    const expenses = await prisma.expense.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log('Debug - Income Comparison API:', {
      userId,
      year: targetYear,
      incomesCount: incomes.length,
      expensesCount: expenses.length,
      totalIncomeAmount: incomes.reduce((sum: number, i: any) => sum + i.amount, 0),
      totalExpenseAmount: expenses.reduce((sum: number, e: any) => sum + e.amount, 0),
    });

    // Group by month
    const monthlyData: Record<number, { income: number; expenses: number; savingsAmount: number; spendingPercentage: number }> = {};
    
    // Process incomes
    incomes.forEach((income: any) => {
      const month = new Date(income.date).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, savingsAmount: 0, spendingPercentage: 0 };
      }
      monthlyData[month].income += income.amount;
    });

    // Process expenses (excluding SAVINGS category)
    expenses.forEach((expense: any) => {
      // Skip SAVINGS category as it's not a spending
      if (expense.category === 'SAVINGS') return;
      
      const month = new Date(expense.date).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0, savingsAmount: 0, spendingPercentage: 0 };
      }
      monthlyData[month].expenses += expense.amount;
    });

    // Calculate savings and spending percentage
    Object.keys(monthlyData).forEach((monthStr) => {
      const month = parseInt(monthStr);
      const data = monthlyData[month];
      data.savingsAmount = data.income - data.expenses;
      data.spendingPercentage = data.income > 0 ? (data.expenses / data.income) * 100 : 0;
    });

    // Convert to array format for charts
    const comparisonData = [];
    for (let i = 0; i < 12; i++) {
      const data = monthlyData[i] || { income: 0, expenses: 0, savingsAmount: 0, spendingPercentage: 0 };
      comparisonData.push({
        month: i,
        monthName: new Date(targetYear, i, 1).toLocaleString('default', { month: 'short' }),
        income: data.income,
        expenses: data.expenses,
        savings: data.savingsAmount,
        spendingPercentage: parseFloat(data.spendingPercentage.toFixed(2)),
      });
    }

    // Calculate totals (excluding SAVINGS from expenses)
    const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0);
    const totalExpenses = expenses
      .filter((expense: any) => expense.category !== 'SAVINGS')
      .reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const totalSavings = totalIncome - totalExpenses;
    const overallSpendingPercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    console.log('Debug - Final Totals:', {
      totalIncome,
      totalExpenses,
      totalSavings,
      overallSpendingPercentage,
      monthlyDataKeys: Object.keys(monthlyData),
    });

    return NextResponse.json({
      monthlyComparison: comparisonData,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSavings,
        spendingPercentage: parseFloat(overallSpendingPercentage.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error fetching income comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch income comparison" },
      { status: 500 }
    );
  }
}