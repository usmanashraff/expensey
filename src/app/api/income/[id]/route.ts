import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const body = await request.json();
    const { source, amount, date, currency, description, isRecurring } = body;

    const income = await prisma.income.update({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        source,
        amount: parseFloat(amount),
        date: new Date(date),
        currency,
        description,
        isRecurring,
      },
    });

    return NextResponse.json(income);
  } catch (error) {
    console.error("Error updating income:", error);
    return NextResponse.json(
      { error: "Failed to update income" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    await prisma.income.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting income:", error);
    return NextResponse.json(
      { error: "Failed to delete income" },
      { status: 500 }
    );
  }
}