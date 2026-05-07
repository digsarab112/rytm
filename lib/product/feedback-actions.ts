"use server";

import { revalidatePath } from "next/cache";

import { getPrismaClient, isDatabaseConfigured } from "@/lib/db/prisma";
import { FeedbackType, ReviewStatus } from "@/lib/generated/prisma/client";
import type { ProductFeedbackReply, ProductReview } from "@/types/store";

export async function submitProductFeedback(review: ProductReview) {
  if (!isDatabaseConfigured()) {
    return { ok: false as const, error: "database-not-configured" as const };
  }

  try {
    const prisma = getPrismaClient();
    const product = await prisma.product.findUnique({
      where: { id: review.productId },
    });

    if (!product) {
      return { ok: false as const, error: "product-not-found" as const };
    }

    const customerId = await findFeedbackCustomerId(
      review.customerId,
      review.customerEmail,
    );

    await prisma.productFeedback.create({
      data: {
        id: review.id,
        productId: review.productId,
        customerId,
        type: review.type === "question" ? FeedbackType.QUESTION : FeedbackType.REVIEW,
        status: ReviewStatus.APPROVED,
        rating: review.rating,
        customerName: review.customerName,
        customerEmail: review.customerEmail,
        customerPhone: review.customerPhone,
        comment: review.comment,
        isVerifiedPurchase: false,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath(`/uk/products/${product.slug}`);
    revalidatePath(`/ru/products/${product.slug}`);

    return { ok: true as const };
  } catch (error) {
    console.error("Product feedback save failed", error);
    return { ok: false as const, error: "save-failed" as const };
  }
}

export async function submitProductFeedbackReply(
  productId: string,
  reply: ProductFeedbackReply,
) {
  if (!isDatabaseConfigured()) {
    return { ok: false as const, error: "database-not-configured" as const };
  }

  try {
    const prisma = getPrismaClient();
    const feedback = await prisma.productFeedback.findUnique({
      where: { id: reply.reviewId },
      include: { product: true },
    });

    if (!feedback) {
      return { ok: false as const, error: "feedback-not-found" as const };
    }

    const customerId = await findFeedbackCustomerId(
      reply.customerId,
      reply.customerEmail,
    );

    await prisma.productFeedbackReply.create({
      data: {
        id: reply.id,
        feedbackId: reply.reviewId,
        customerId,
        customerName: reply.customerName,
        customerEmail: reply.customerEmail,
        customerPhone: reply.customerPhone,
        comment: reply.comment,
        status: ReviewStatus.APPROVED,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath(`/uk/products/${feedback.product.slug}`);
    revalidatePath(`/ru/products/${feedback.product.slug}`);
    revalidatePath(`/uk/products/${productId}`);
    revalidatePath(`/ru/products/${productId}`);

    return { ok: true as const };
  } catch (error) {
    console.error("Product feedback reply save failed", error);
    return { ok: false as const, error: "save-failed" as const };
  }
}

async function findFeedbackCustomerId(
  customerId: string | undefined,
  customerEmail: string | undefined,
) {
  const prisma = getPrismaClient();

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (customer) {
      return customer.id;
    }
  }

  if (customerEmail) {
    const customer = await prisma.customer.findUnique({
      where: { email: customerEmail.trim().toLowerCase() },
      select: { id: true },
    });

    if (customer) {
      return customer.id;
    }
  }

  return undefined;
}
