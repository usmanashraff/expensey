import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let whereClause: any = { userId: userId };

    if (month && year) {
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));
      
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const incomes = await prisma.income.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    const body = await request.json();
    const { source, amount, date, currency, description, isRecurring } = body;

    if (!source || !amount || !date) {
      return NextResponse.json(
        { error: "Source, amount, and date are required" },
        { status: 400 }
      );
    }

    const income = await prisma.income.create({
      data: {
        source,
        amount: parseFloat(amount),
        date: new Date(date),
        userId: userId,
        currency: currency || "PKR",
        description,
        isRecurring: isRecurring || false,
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}