"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Trash2 } from "lucide-react";

import {
  AdminActionFeedback,
  useAdminActionFeedback,
} from "@/components/admin/action-feedback";
import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  SelectField,
  TextAreaField,
  ToggleField,
} from "@/components/admin/admin-ui";
import { StarRating } from "@/components/product/star-rating";
import { useLocalStorageState } from "@/components/admin/use-local-storage-state";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PRODUCTS_STORAGE_KEY,
  ADMIN_REVIEWS_STORAGE_KEY,
} from "@/lib/admin/storage";
import { formatAdminDate } from "@/lib/admin/order-labels";
import { getProductName } from "@/lib/catalog/helpers";
import { getFeedbackType, getReviewRating } from "@/lib/catalog/reviews";
import type {
  ProductFeedbackReply,
  ProductFeedbackType,
  ProductPreview,
  ProductReview,
  ProductReviewStatus,
} from "@/types/store";

type ReviewsAdminPageProps = {
  initialProducts: ProductPreview[];
  initialReviews: ProductReview[];
};

const reviewStatuses: ProductReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
];
const feedbackTypes: ProductFeedbackType[] = ["review", "question"];
type ReplyFilter = "all" | "with-replies" | "without-replies";

export function ReviewsAdminPage({
  initialProducts,
  initialReviews,
}: ReviewsAdminPageProps) {
  const [reviews, setReviews] = useLocalStorageState(
    ADMIN_REVIEWS_STORAGE_KEY,
    initialReviews,
  );
  const [products] = useLocalStorageState(
    ADMIN_PRODUCTS_STORAGE_KEY,
    initialProducts,
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>("all");
  const { feedback, runAction, isPending } = useAdminActionFeedback();
  const replyCount = reviews.reduce(
    (total, review) => total + (review.replies?.length ?? 0),
    0,
  );

  const filteredReviews = useMemo(
    () =>
      reviews
        .filter((review) =>
          statusFilter === "all" ? true : review.status === statusFilter,
        )
        .filter((review) =>
          productFilter === "all" ? true : review.productId === productFilter,
        )
        .filter((review) =>
          typeFilter === "all" ? true : getFeedbackType(review) === typeFilter,
        )
        .filter((review) => {
          if (replyFilter === "with-replies") {
            return (review.replies?.length ?? 0) > 0;
          }

          if (replyFilter === "without-replies") {
            return (review.replies?.length ?? 0) === 0;
          }

          return true;
        })
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [productFilter, replyFilter, reviews, statusFilter, typeFilter],
  );

  function updateReview(reviewId: string, updates: Partial<ProductReview>) {
    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : review,
      ),
    );
  }

  function deleteReview(reviewId: string) {
    setReviews((currentReviews) =>
      currentReviews.filter((review) => review.id !== reviewId),
    );
  }

  function updateReply(
    reviewId: string,
    replyId: string,
    updates: Partial<ProductFeedbackReply>,
  ) {
    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              replies: (review.replies ?? []).map((reply) =>
                reply.id === replyId
                  ? { ...reply, ...updates, updatedAt: new Date().toISOString() }
                  : reply,
              ),
              updatedAt: new Date().toISOString(),
            }
          : review,
      ),
    );
  }

  function deleteReply(reviewId: string, replyId: string) {
    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              replies: (review.replies ?? []).filter(
                (reply) => reply.id !== replyId,
              ),
              updatedAt: new Date().toISOString(),
            }
          : review,
      ),
    );
  }

  return (
    <div className="grid gap-6">
      <AdminActionFeedback feedback={feedback} />
      <AdminPageHeader
        title="Reviews and questions"
        description="Manage public product feedback, customer replies, ratings, customer questions, store replies, and verified purchase markers."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="All feedback" value={String(reviews.length)} />
        <Metric
          label="Questions"
          value={String(reviews.filter((review) => getFeedbackType(review) === "question").length)}
        />
        <Metric label="Customer replies" value={String(replyCount)} />
        <Metric
          label="Shown"
          value={String(reviews.filter((review) => review.status === "approved").length)}
        />
        <Metric
          label="Hidden"
          value={String(reviews.filter((review) => review.status === "rejected").length)}
        />
      </section>
      <AdminCard title="Filters" className="overflow-hidden">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,0.75fr)_minmax(0,1.4fr)_minmax(0,0.8fr)]">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <option value="all">All statuses</option>
            {reviewStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
          >
            <option value="all">All types</option>
            {feedbackTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Product"
            value={productFilter}
            onChange={setProductFilter}
          >
            <option value="all">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {getProductName(product, "uk")}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Replies"
            value={replyFilter}
            onChange={(value) => setReplyFilter(value as ReplyFilter)}
          >
            <option value="all">All feedback</option>
            <option value="with-replies">With customer replies</option>
            <option value="without-replies">Without replies</option>
          </SelectField>
        </div>
      </AdminCard>
      {filteredReviews.length === 0 ? (
        <EmptyState text="No reviews match these filters." />
      ) : (
        <div className="grid gap-4">
          {filteredReviews.map((review) => {
            const product = products.find((item) => item.id === review.productId);
            const feedbackType = getFeedbackType(review);
            const rating = getReviewRating(review);

            return (
              <AdminCard key={review.id}>
                <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {rating > 0 ? (
                        <StarRating rating={rating} />
                      ) : (
                        <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                          No rating
                        </span>
                      )}
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {feedbackType}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                        {review.status}
                      </span>
                      {review.isVerifiedPurchase ? (
                        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                          Verified purchase
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-foreground">
                      {review.customerName}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatAdminDate(review.createdAt)} -{" "}
                      {product ? getProductName(product, "uk") : review.productId}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                    {review.adminReply ? (
                      <div className="mt-4 rounded-lg border border-secondary bg-background p-4">
                        <p className="text-xs font-bold uppercase tracking-normal text-primary">
                          Store reply
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {review.adminReply}
                        </p>
                        {review.adminRepliedAt ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatAdminDate(review.adminRepliedAt)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {review.replies?.length ? (
                      <div className="mt-4 grid gap-3 rounded-lg border border-border bg-background p-4">
                        <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">
                          Customer replies
                        </p>
                        {review.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="grid gap-3 rounded-lg border border-border bg-card p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-foreground">
                                {reply.customerName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatAdminDate(reply.createdAt)}
                              </span>
                              <span className="rounded-full bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                                {reply.status}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {reply.comment}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending(`reply-show-${reply.id}`)}
                                onClick={() =>
                                  runAction(
                                    `reply-show-${reply.id}`,
                                    () =>
                                      updateReply(review.id, reply.id, {
                                        status: "approved",
                                      }),
                                    "Reply shown.",
                                  )
                                }
                              >
                                Show
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending(`reply-hide-${reply.id}`)}
                                onClick={() =>
                                  runAction(
                                    `reply-hide-${reply.id}`,
                                    () =>
                                      updateReply(review.id, reply.id, {
                                        status: "rejected",
                                      }),
                                    "Reply hidden.",
                                  )
                                }
                              >
                                Hide
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isPending(`reply-delete-${reply.id}`)}
                                onClick={() =>
                                  runAction(
                                    `reply-delete-${reply.id}`,
                                    () => deleteReply(review.id, reply.id),
                                    "Reply deleted.",
                                  )
                                }
                              >
                                <Trash2 />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-2 text-sm">
                      <InfoRow
                        label="Email"
                        value={review.customerEmail || "Not provided"}
                      />
                      <InfoRow
                        label="Phone"
                        value={review.customerPhone || "Not provided"}
                      />
                    </div>
                  </div>
                  <div className="grid min-w-0 content-start gap-4 rounded-lg border border-border bg-background p-4">
                    <SelectField
                      label="Review status"
                      value={review.status}
                      onChange={(status) =>
                        runAction(
                          `review-status-${review.id}`,
                          () =>
                            updateReview(review.id, {
                              status: status as ProductReviewStatus,
                            }),
                          "Review status updated.",
                        )
                      }
                    >
                      {reviewStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </SelectField>
                    <ToggleField
                      label="Verified purchase"
                      checked={review.isVerifiedPurchase}
                      onChange={(isVerifiedPurchase) =>
                        runAction(
                          `verified-${review.id}`,
                          () => updateReview(review.id, { isVerifiedPurchase }),
                          "Verified purchase status updated.",
                        )
                      }
                    />
                    <TextAreaField
                      label="Admin reply"
                      rows={5}
                      value={review.adminReply ?? ""}
                      onChange={(adminReply) =>
                        updateReview(review.id, { adminReply })
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        disabled={isPending(`approve-${review.id}`)}
                        onClick={() =>
                          runAction(
                            `approve-${review.id}`,
                            () => updateReview(review.id, { status: "approved" }),
                            "Feedback shown.",
                          )
                        }
                      >
                        {isPending(`approve-${review.id}`) ? "Saving..." : "Show"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending(`reject-${review.id}`)}
                        onClick={() =>
                          runAction(
                            `reject-${review.id}`,
                            () => updateReview(review.id, { status: "rejected" }),
                            "Feedback hidden.",
                          )
                        }
                      >
                        {isPending(`reject-${review.id}`) ? "Saving..." : "Hide"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending(`reply-${review.id}`)}
                        onClick={() =>
                          runAction(
                            `reply-${review.id}`,
                            () =>
                              updateReview(review.id, {
                                adminRepliedAt: review.adminReply?.trim()
                                  ? new Date().toISOString()
                                  : undefined,
                              }),
                            "Store reply saved.",
                          )
                        }
                      >
                        {isPending(`reply-${review.id}`) ? "Saving..." : "Save reply"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending(`delete-${review.id}`)}
                        onClick={() =>
                          runAction(
                            `delete-${review.id}`,
                            () => deleteReview(review.id),
                            "Feedback deleted.",
                          )
                        }
                      >
                        <Trash2 />
                        {isPending(`delete-${review.id}`) ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <MessageSquare className="size-5" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-bold text-foreground">{value}</p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}
