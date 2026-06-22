"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function setInterviewTarget(companySlug: string, targetDate: string) {
  const userId = await requireUserId();
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) throw new Error("Company not found");

  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");

  await prisma.interviewTarget.upsert({
    where: { userId_companyId: { userId, companyId: company.id } },
    update: { targetDate: date },
    create: { userId, companyId: company.id, targetDate: date },
  });

  revalidatePath(`/companies/${companySlug}`);
  revalidatePath("/");
}

export async function clearInterviewTarget(companySlug: string) {
  const userId = await requireUserId();
  const company = await prisma.company.findUnique({ where: { slug: companySlug } });
  if (!company) return;

  await prisma.interviewTarget.deleteMany({ where: { userId, companyId: company.id } });

  revalidatePath(`/companies/${companySlug}`);
  revalidatePath("/");
}
