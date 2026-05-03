import type { ProductFeedbackType, ProductReview } from "@/types/store";

export type ProductReviewSummary = {
  averageRating: number;
  reviewCount: number;
};

export function getApprovedProductReviews(
  reviews: ProductReview[],
  productId: string,
) {
  return getApprovedProductFeedback(reviews, productId).filter(
    (review) => getFeedbackType(review) === "review" && getReviewRating(review) > 0,
  );
}

export function getApprovedProductFeedback(
  reviews: ProductReview[],
  productId: string,
) {
  return reviews
    .filter(
      (review) =>
        review.productId === productId && review.status !== "rejected",
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getProductReviewSummary(
  reviews: ProductReview[],
  productId: string,
): ProductReviewSummary {
  const approvedReviews = getApprovedProductReviews(reviews, productId);

  if (approvedReviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const averageRating =
    approvedReviews.reduce((total, review) => total + getReviewRating(review), 0) /
    approvedReviews.length;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: approvedReviews.length,
  };
}

export function clampRating(value: number) {
  if (!Number.isFinite(value)) {
    return 5;
  }

  return Math.min(5, Math.max(1, Math.round(value)));
}

export function getFeedbackType(review: ProductReview): ProductFeedbackType {
  return review.type ?? "review";
}

export function getReviewRating(review: ProductReview) {
  return typeof review.rating === "number" ? clampRating(review.rating) : 0;
}
