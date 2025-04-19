import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CreateRuleButton } from '@/components/rules/create-rule-button';
import { RuleList } from '@/components/rules/rule-list';

export const metadata: Metadata = {
  title: 'Flight Rules | Flight Tracker',
  description: 'Manage your flight tracking rules',
};

async function getRules(userId: string) {
  try {
    const rules = await prisma.$queryRaw`
      SELECT 
        r.id, 
        r.name, 
        r.description, 
        r.operator, 
        r."isActive", 
        r."createdAt", 
        r."updatedAt",
        0 as "conditionCount",
        COUNT(DISTINCT a.id) as "alertCount"
      FROM "Rule" r
      LEFT JOIN "Alert" a ON r.id = a."ruleId"
      WHERE r."userId" = ${userId}
      GROUP BY r.id
      ORDER BY r."createdAt" DESC
    `;

    return rules as any[];
  } catch (error) {
    console.error("Error fetching rules:", error);
    return [];
  }
}

export default async function RulesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const rules = await getRules(session.user.id);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Flight Rules</h1>
        <CreateRuleButton />
      </div>

      <RuleList rules={rules} />
    </div>
  );
} 