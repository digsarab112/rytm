"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { HelpCircle, MessageCircle, Reply, Star } from "lucide-react";

import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_REVIEWS_STORAGE_KEY, createAdminId } from "@/lib/admin/storage";
import {
  clampRating,
  getApprovedProductFeedback,
  getFeedbackType,
  getProductReviewSummary,
  getReviewRating,
} from "@/lib/catalog/reviews";
import {
  submitProductFeedback,
  submitProductFeedbackReply,
} from "@/lib/product/feedback-actions";
import { getCustomerSession } from "@/lib/customer/auth-storage";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import type { CustomerSession } from "@/types/customer";
import type {
  ProductFeedbackReply,
  ProductFeedbackType,
  ProductReview,
} from "@/types/store";

const labels = {
  uk: {
    title: "Відгуки та питання",
    subtitle: "",
    empty: "Для цього товару ще немає відгуків або питань.",
    verified: "Підтверджена покупка",
    storeReply: "Відповідь Rytm",
    formTitle: "Поділіться досвідом або поставте питання",
    review: "Відгук",
    question: "Питання",
    reviewHint: "Оцініть товар і розкажіть, як він вам підійшов.",
    questionHint: "Запитайте про застосування, доставку або деталі товару.",
    name: "Ім'я",
    email: "Email",
    rating: "Оцінка",
    comment: "Коментар",
    submitReview: "Надіслати відгук",
    submitQuestion: "Надіслати питання",
    required: "Заповніть ім'я, email і коментар.",
    commentRequired: "Заповніть коментар.",
    successReview: "Дякуємо. Відгук опубліковано.",
    successQuestion: "Дякуємо. Питання опубліковано.",
    saveFailed:
      "Не вдалося зберегти коментар. Перевірте підключення бази даних або спробуйте ще раз.",
    reviews: "відгуків",
    noRating: "Без оцінки",
    reply: "Відповісти",
    replyTitle: "Ваша відповідь",
    replySubmit: "Надіслати відповідь",
    replySuccess: "Дякуємо. Відповідь опубліковано.",
    replies: "Відповіді",
    signedInAs: "Ваше ім'я",
  },
  ru: {
    title: "Отзывы и вопросы",
    subtitle: "",
    empty: "У этого товара пока нет отзывов или вопросов.",
    verified: "Подтвержденная покупка",
    storeReply: "Ответ Rytm",
    formTitle: "Поделитесь опытом или задайте вопрос",
    review: "Отзыв",
    question: "Вопрос",
    reviewHint: "Оцените товар и расскажите, как он вам подошел.",
    questionHint: "Спросите о применении, доставке или деталях товара.",
    name: "Имя",
    email: "Email",
    rating: "Оценка",
    comment: "Комментарий",
    submitReview: "Отправить отзыв",
    submitQuestion: "Отправить вопрос",
    required: "Заполните имя, email и комментарий.",
    commentRequired: "Заполните комментарий.",
    successReview: "Спасибо. Отзыв опубликован.",
    successQuestion: "Спасибо. Вопрос опубликован.",
    saveFailed:
      "Не удалось сохранить комментарий. Проверьте подключение базы данных или попробуйте еще раз.",
    reviews: "отзывов",
    noRating: "Без оценки",
    reply: "Ответить",
    replyTitle: "Ваш ответ",
    replySubmit: "Отправить ответ",
    replySuccess: "Спасибо. Ответ опубликован.",
    replies: "Ответы",
    signedInAs: "Ваше имя",
  },
} as const;

type ProductReviewsProps = {
  productId: string;
  locale: Locale;
  initialReviews: ProductReview[];
};

export function ProductReviews({
  productId,
  locale,
  initialReviews,
}: ProductReviewsProps) {
  const copy = labels[locale];
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [feedbackType, setFeedbackType] =
    useState<ProductFeedbackType>("review");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(
    null,
  );

  const approvedFeedback = useMemo(
    () => getApprovedProductFeedback(reviews, productId),
    [productId, reviews],
  );
  const summary = useMemo(
    () => getProductReviewSummary(reviews, productId),
    [productId, reviews],
  );
  const signedCustomer = getSignedCustomer(customerSession);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCustomerSession(getCustomerSession());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const formCustomer = getFormCustomer(formData, customerSession);
    const comment = String(formData.get("comment") ?? "").trim();

    if (!comment || !formCustomer) {
      setError(comment ? copy.required : copy.commentRequired);
      setMessage("");
      return;
    }

    const now = new Date().toISOString();
    const review: ProductReview = {
      id: createAdminId(feedbackType),
      productId,
      customerId: formCustomer.customerId,
      type: feedbackType,
      customerName: formCustomer.name,
      customerEmail: formCustomer.email,
      rating: feedbackType === "review" ? clampRating(rating) : undefined,
      comment,
      status: "approved",
      isVerifiedPurchase: false,
      createdAt: now,
      updatedAt: now,
    };
    const nextReviews = [review, ...reviews];

    try {
      const result = await submitProductFeedback(review);

      if (!result.ok) {
        setError(copy.saveFailed);
        setMessage("");
        return;
      }

      setReviews(nextReviews);
      setError("");
      setMessage(
        feedbackType === "review" ? copy.successReview : copy.successQuestion,
      );
      window.localStorage.setItem(
        ADMIN_REVIEWS_STORAGE_KEY,
        JSON.stringify(nextReviews),
      );
      window.dispatchEvent(new Event("storage"));
      form.reset();
      setFeedbackType("review");
      setRating(5);
    } catch {
      setError(copy.saveFailed);
      setMessage("");
    }
  }

  async function handleReplySubmit(
    reviewId: string,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const formCustomer = getFormCustomer(formData, customerSession);
    const comment = String(formData.get("comment") ?? "").trim();

    setReplyMessages((current) => ({ ...current, [reviewId]: "" }));
    setReplyErrors((current) => ({ ...current, [reviewId]: "" }));

    if (!comment || !formCustomer) {
      setReplyErrors((current) => ({
        ...current,
        [reviewId]: comment ? copy.required : copy.commentRequired,
      }));
      return;
    }

    const now = new Date().toISOString();
    const reply: ProductFeedbackReply = {
      id: createAdminId("feedback-reply"),
      reviewId,
      customerId: formCustomer.customerId,
      customerName: formCustomer.name,
      customerEmail: formCustomer.email,
      comment,
      status: "approved",
      createdAt: now,
      updatedAt: now,
    };
    const nextReviews = reviews.map((review) =>
      review.id === reviewId
        ? {
            ...review,
            replies: [reply, ...(review.replies ?? [])],
            updatedAt: now,
          }
        : review,
    );

    try {
      const result = await submitProductFeedbackReply(productId, reply);

      if (!result.ok) {
        setReplyErrors((current) => ({
          ...current,
          [reviewId]: copy.saveFailed,
        }));
        return;
      }

      setReviews(nextReviews);
      setReplyMessages((current) => ({
        ...current,
        [reviewId]: copy.replySuccess,
      }));
      setReplyingToId(null);
      window.localStorage.setItem(
        ADMIN_REVIEWS_STORAGE_KEY,
        JSON.stringify(nextReviews),
      );
      window.dispatchEvent(new Event("storage"));
      form.reset();
    } catch {
      setReplyErrors((current) => ({
        ...current,
        [reviewId]: copy.saveFailed,
      }));
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{copy.title}</h2>
            </div>
            <div className="shrink-0 rounded-lg border border-border bg-background px-4 py-3">
              {summary.reviewCount > 0 ? (
                <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                  <StarRating rating={summary.averageRating} size="md" />
                  <span className="font-bold text-foreground">
                    {summary.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({summary.reviewCount}&nbsp;{copy.reviews})
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">
                  {copy.empty}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {approvedFeedback.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {copy.empty}
              </div>
            ) : (
              approvedFeedback.map((review) => {
                const type = getFeedbackType(review);
                const reviewRating = getReviewRating(review);
                const visibleReplies = (review.replies ?? []).filter(
                  (replyItem) => replyItem.status !== "rejected",
                );

                return (
                  <div
                    key={review.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {type === "review" ? (
                              <MessageCircle className="size-3.5" />
                            ) : (
                              <HelpCircle className="size-3.5" />
                            )}
                            {copy[type]}
                          </span>
                          {review.isVerifiedPurchase ? (
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                              {copy.verified}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 font-bold text-foreground">
                          {review.customerName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt, locale)}
                        </p>
                      </div>
                      {reviewRating > 0 ? (
                        <StarRating rating={reviewRating} />
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">
                          {copy.noRating}
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                    {review.adminReply ? (
                      <div className="mt-4 rounded-lg border border-secondary bg-card p-4">
                        <p className="text-xs font-bold uppercase tracking-normal text-primary">
                          {copy.storeReply}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {review.adminReply}
                        </p>
                        {review.adminRepliedAt ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatReviewDate(review.adminRepliedAt, locale)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {visibleReplies.length > 0 ? (
                      <div className="mt-4 grid gap-3 border-t border-border pt-4">
                        <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">
                          {copy.replies}
                        </p>
                        {visibleReplies.map((replyItem) => (
                          <div
                            key={replyItem.id}
                            className="rounded-lg border border-border bg-card p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-bold text-foreground">
                                {replyItem.customerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatReviewDate(replyItem.createdAt, locale)}
                              </p>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {replyItem.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReplyingToId((currentId) =>
                            currentId === review.id ? null : review.id,
                          )
                        }
                      >
                        <Reply />
                        {copy.reply}
                      </Button>
                    </div>
                    {replyingToId === review.id ? (
                      <form
                        className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4"
                        onSubmit={(event) => handleReplySubmit(review.id, event)}
                      >
                        <p className="font-bold text-foreground">
                          {copy.replyTitle}
                        </p>
                        {replyErrors[review.id] ? (
                          <Notice tone="error" text={replyErrors[review.id]} />
                        ) : null}
                        {replyMessages[review.id] ? (
                          <Notice tone="success" text={replyMessages[review.id]} />
                        ) : null}
                        <CustomerIdentityFields
                          copy={copy}
                          signedCustomer={signedCustomer}
                        />
                        <label className="grid gap-2 text-sm font-semibold text-foreground">
                          {copy.comment}
                          <textarea
                            name="comment"
                            rows={3}
                            required
                            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>
                        <Button type="submit" size="sm" className="w-fit">
                          {copy.replySubmit}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </article>
        <form
          className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h3 className="text-lg font-bold text-foreground">{copy.formTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {feedbackType === "review" ? copy.reviewHint : copy.questionHint}
          </p>
          <div className="mt-5 grid gap-4">
            {error ? <Notice tone="error" text={error} /> : null}
            {message ? <Notice tone="success" text={message} /> : null}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-1">
              {(["review", "question"] as ProductFeedbackType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                    feedbackType === type
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {copy[type]}
                </button>
              ))}
            </div>
            {feedbackType === "review" ? (
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {copy.rating}
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${copy.rating} ${value}`}
                      onClick={() => setRating(value)}
                      className="rounded-full p-1 text-primary transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        className={cn(
                          "size-7",
                          value <= rating
                            ? "fill-primary text-primary"
                            : "fill-transparent text-muted-foreground/40",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <CustomerIdentityFields
              copy={copy}
              signedCustomer={signedCustomer}
            />
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              {copy.comment}
              <textarea
                name="comment"
                rows={5}
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <Button type="submit">
              {feedbackType === "review"
                ? copy.submitReview
                : copy.submitQuestion}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function CustomerIdentityFields({
  copy,
  signedCustomer,
}: {
  copy: (typeof labels)[Locale];
  signedCustomer: ReturnType<typeof getSignedCustomer>;
}) {
  return (
    <div className="grid gap-3">
      {signedCustomer ? (
        <div className="rounded-lg border border-secondary bg-secondary/40 px-4 py-3 text-sm text-secondary-foreground">
          <p className="font-semibold">{copy.signedInAs}</p>
          <p className="mt-1 break-words text-base font-bold leading-6">
            {signedCustomer.name}
          </p>
          <input type="hidden" name="customerName" value={signedCustomer.name} />
          <input type="hidden" name="customerEmail" value={signedCustomer.email} />
        </div>
      ) : (
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.name}
            <Input name="customerName" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            {copy.email}
            <Input name="customerEmail" type="email" required />
          </label>
        </div>
      )}
    </div>
  );
}

function Notice({ tone, text }: { tone: "error" | "success"; text: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background px-4 py-3 text-sm font-semibold",
        tone === "error"
          ? "border-primary/30 text-primary"
          : "border-secondary text-secondary-foreground",
      )}
    >
      {text}
    </div>
  );
}

function getSignedCustomer(session: CustomerSession | null) {
  if (!session?.email) {
    return null;
  }

  return {
    customerId: session.customerId,
    name: normalizeCustomerDisplayName(session.name) || session.email.split("@")[0],
    email: session.email.trim().toLowerCase(),
  };
}

function getFormCustomer(
  formData: FormData,
  session: CustomerSession | null,
) {
  const signedCustomer = getSignedCustomer(session);
  const name =
    String(formData.get("customerName") ?? "").trim() ||
    signedCustomer?.name ||
    "";
  const email =
    String(formData.get("customerEmail") ?? "").trim().toLowerCase() ||
    signedCustomer?.email ||
    "";

  if (!name || !email) {
    return null;
  }

  return {
    customerId: signedCustomer?.customerId,
    name: normalizeCustomerDisplayName(name),
    email,
  };
}

function normalizeCustomerDisplayName(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+\bFull\b$/i, "").trim();
}

function formatReviewDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "ru-UA", {
    dateStyle: "medium",
  }).format(new Date(value));
}
