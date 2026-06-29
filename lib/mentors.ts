import { prisma } from "@/lib/prisma";

const mentorSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  mentorTitle: true,
  mentorCompany: true,
  mentorBio: true,
  mentorYears: true,
} as const;

export async function getMentors() {
  return prisma.user.findMany({
    where: { isMentor: true },
    select: mentorSelect,
    orderBy: { mentorYears: "desc" },
  });
}

export async function getMentorInbox(mentorId: string) {
  return prisma.feedbackRequest.findMany({
    where: { mentorId },
    include: { requester: { select: { id: true, name: true, username: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSentFeedbackRequests(requesterId: string) {
  return prisma.feedbackRequest.findMany({
    where: { requesterId },
    include: { mentor: { select: { id: true, name: true, username: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMentorSidebarInfo(userId: string) {
  const [user, pendingCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { isMentor: true } }),
    prisma.feedbackRequest.count({ where: { mentorId: userId, status: "PENDING" } }),
  ]);

  return { isMentor: user?.isMentor ?? false, pendingCount };
}

export type Mentor = Awaited<ReturnType<typeof getMentors>>[number];
export type MentorInboxItem = Awaited<ReturnType<typeof getMentorInbox>>[number];
export type SentFeedbackRequest = Awaited<ReturnType<typeof getSentFeedbackRequests>>[number];
