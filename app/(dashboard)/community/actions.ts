"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      authorId: session.user.id,
      tags: {
        create: tagConnects.map(({ tagId }) => ({ tagId })),
      },
    },
  });

  revalidatePath("/community");
  redirect(`/community/${slug}`);
}

export async function createComment(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const content = (formData.get("content") as string)?.trim();
  if (!content) throw new Error("Comment cannot be empty");

  await prisma.comment.create({
    data: { content, postId, authorId: session.user.id },
  });

  revalidatePath(`/community`);
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
