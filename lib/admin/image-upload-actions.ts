"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "@/lib/admin/auth";
import {
  getImageStoragePlan,
  uploadImageFile,
  type ImageUploadPurpose,
} from "@/lib/integrations/storage";

export type AdminImageUploadResult =
  | {
      ok: true;
      url: string;
      provider: string;
      storageKey?: string;
    }
  | {
      ok: false;
      error: string;
      provider?: string;
    };

export async function uploadAdminImage(
  formData: FormData,
): Promise<AdminImageUploadResult> {
  const session = await getAdminSession();

  if (!session) {
    return { ok: false, error: "Admin session expired. Please sign in again." };
  }

  const file = formData.get("file");
  const purpose = normalizePurpose(formData.get("purpose"));
  const plan = getImageStoragePlan();

  if (!plan.uploadAvailable) {
    return {
      ok: false,
      provider: plan.provider,
      error: plan.note,
    };
  }

  if (!(file instanceof File)) {
    return { ok: false, provider: plan.provider, error: "Choose an image file." };
  }

  try {
    const uploadedImage = await uploadImageFile(file, purpose);

    revalidatePath("/", "layout");

    return {
      ok: true,
      url: uploadedImage.url,
      provider: uploadedImage.provider,
      storageKey: uploadedImage.storageKey,
    };
  } catch (error) {
    return {
      ok: false,
      provider: plan.provider,
      error: error instanceof Error ? error.message : "Image upload failed.",
    };
  }
}

function normalizePurpose(value: FormDataEntryValue | null): ImageUploadPurpose {
  if (
    value === "product" ||
    value === "category" ||
    value === "site" ||
    value === "hero" ||
    value === "logo"
  ) {
    return value;
  }

  return "site";
}
