import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");

    // Get monthly income totals for the year
    const startDate = year 
      ? new Date(parseInt(year), 0, 1)
      : new Date(new Date().getFullYear(), 0, 1);
    
    const endDate = year
      ? new Date(parseInt(year), 11, 31, 23, 59, 59, 999)
      : new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

    const incomes = await prisma.income.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Group by month
    const monthlyIncome: Record<number, number> = {};
    incomes.forEach((income: any) => {
      const month = new Date(income.date).getMonth();
      monthlyIncome[month] = (monthlyIncome[month] || 0) + income.amount;
    });

    // Calculate month-over-month growth rates
    const growthRates: { month: number; income: number; growthRate: number | null }[] = [];
    let lastMonthWithIncome = -1;
    
    for (let i = 0; i < 12; i++) {
      const currentIncome = monthlyIncome[i] || 0;
      
      let growthRate = null;
      // Only calculate growth rate if we have a previous month with income and current month has income
      if (lastMonthWithIncome >= 0 && currentIncome > 0) {
        const previousIncome = monthlyIncome[lastMonthWithIncome] || 0;
        if (previousIncome > 0) {
          growthRate = ((currentIncome - previousIncome) / previousIncome) * 100;
        }
      }
      
      // Update last month with income if current month has income
      if (currentIncome > 0) {
        lastMonthWithIncome = i;
      }
      
      growthRates.push({
        month: i,
        income: currentIncome,
        growthRate,
      });
    }

    // Get total income for the period
    const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0);

    // Get average monthly income
    const monthsWithIncome = Object.keys(monthlyIncome).length;
    const averageMonthlyIncome = monthsWithIncome > 0 ? totalIncome / monthsWithIncome : 0;

    return NextResponse.json({
      monthlyIncome: growthRates,
      totalIncome,
      averageMonthlyIncome,
      monthsWithIncome,
    });
  } catch (error) {
    console.error("Error fetching income stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch income statistics" },
      { status: 500 }
    );
  }
}