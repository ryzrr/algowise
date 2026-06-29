"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PostType } from "@prisma/client";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function generateSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 60) +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const tagSlugs = formData.getAll("tags") as string[];
  const typeValue = formData.get("type") as string | null;
  const type: PostType = typeValue === "QUESTION" ? "QUESTION" : "BLOG";

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const slug = generateSlug(title);

  // Upsert tags
  const tagConnects = await Promise.all(
    tagSlugs.map(async (tagSlug) => {
      const name = tagSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { name, slug: tagSlug },
      });
      return { tagId: tag.id };
    })
  );

  await prisma.post.create({
    data: {
      title,
      content,
      slug,
      type,
      authorId: session.user.id,
      tags: {
        create: tagConnects.map(({ tagId }) => ({ tagId })),
      },
    },
  });

  revalidatePath("/community");
  redirect(`/community/${slug}`);
}

export async function createComment(postId: string, formData: FormData, parentId?: string) {
  const userId = await requireUserId();

  const content = (formData.get("content") as string)?.trim();
  if (!content) throw new Error("Comment cannot be empty");

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.postId !== postId) throw new Error("Parent comment not found");
    if (parent.parentId) throw new Error("Cannot reply to a reply");
  }

  const post = await prisma.comment
    .create({
      data: { content, postId, authorId: userId, parentId: parentId ?? null },
    })
    .then(() => prisma.post.findUnique({ where: { id: postId }, select: { slug: true } }));

  revalidatePath("/community");
  if (post) revalidatePath(`/community/${post.slug}`);
}

export async function deleteComment(commentId: string) {
  const userId = await requireUserId();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Not authorized");

  const post = await prisma.post.findUnique({ where: { id: comment.postId }, select: { slug: true } });

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { parentId: commentId } }),
    prisma.comment.delete({ where: { id: commentId } }),
  ]);

  revalidatePath("/community");
  if (post) revalidatePath(`/community/${post.slug}`);
}

export async function acceptAnswer(postId: string, commentId: string) {
  const userId = await requireUserId();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Only the question author can accept an answer");
  if (post.type !== "QUESTION") throw new Error("Only questions can have an accepted answer");

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== postId) throw new Error("Comment not found");

  await prisma.post.update({ where: { id: postId }, data: { acceptedCommentId: commentId } });

  revalidatePath(`/community/${post.slug}`);
}

export async function unacceptAnswer(postId: string) {
  const userId = await requireUserId();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Only the question author can unaccept an answer");

  await prisma.post.update({ where: { id: postId }, data: { acceptedCommentId: null } });

  revalidatePath(`/community/${post.slug}`);
}

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { userId_postId: { userId, postId } },
    });
  } else {
    await prisma.postLike.create({ data: { userId, postId } });
  }

  revalidatePath("/community");
}

export async function markPostViewed(postId: string) {
  const cookieStore = await cookies();
  const viewedKey = `viewed_${postId}`;
  if (!cookieStore.has(viewedKey)) {
    cookieStore.set(viewedKey, "1", {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  }
}
