import { prisma } from '@/lib/prisma'

const defaultUtilityTypes = [
  'Bills',
  'Transport',
  'Ration',
  'Fees',
];

export async function seedUserUtilityTypes(userId: string) {
  try {
    // Check if user already has utility types
    const existingTypes = await prisma.utilityType.findMany({
      where: { userId },
    });

    if (existingTypes.length > 0) {
      return; // User already has utility types
    }

    // Create default utility types for the user
    const utilityTypes = defaultUtilityTypes.map(name => ({
      name,
      userId,
    }));

    await prisma.utilityType.createMany({
      data: utilityTypes,
    });

    console.log(`Created ${utilityTypes.length} default utility types for user ${userId}`);
  } catch (error) {
    console.error('Error seeding utility types:', error);
  }
}