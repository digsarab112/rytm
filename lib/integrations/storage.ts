import "server-only";

import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { normalizeProductImageUrls } from "@/lib/catalog/product-images";

export type ImageStorageProvider =
  | "url"
  | "local";

export type ImageStorageProviderOption = {
  provider: ImageStorageProvider;
  label: string;
  launchReady: boolean;
  requiresServerUpload: boolean;
  note: string;
};

export type ImageUploadPlan = {
  provider: ImageStorageProvider;
  isConfigured: boolean;
  uploadAvailable: boolean;
  options: ImageStorageProviderOption[];
  note: string;
};

export type UploadedImageResult = {
  url: string;
  provider: ImageStorageProvider;
  storageKey?: string;
};

export type ImageUploadPurpose =
  | "product"
  | "category"
  | "site"
  | "hero"
  | "logo";

export const imageStorageProviderOptions: ImageStorageProviderOption[] = [
  {
    provider: "local",
    label: "Local/Hostinger filesystem",
    launchReady: true,
    requiresServerUpload: true,
    note: "Stores uploads under public/uploads by default for local testing and Node hosting.",
  },
  {
    provider: "url",
    label: "Image URL fields",
    launchReady: true,
    requiresServerUpload: false,
    note: "Admins paste existing local or remote image URLs.",
  },
];

const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function getConfiguredProvider(): ImageStorageProvider {
  const provider = process.env.IMAGE_STORAGE_PROVIDER as
    | ImageStorageProvider
    | undefined;

  return provider &&
    imageStorageProviderOptions.some((option) => option.provider === provider)
    ? provider
    : "local";
}

export function getImageStoragePlan(): ImageUploadPlan {
  const provider = getConfiguredProvider();
  const isConfigured =
    provider === "local" ||
    provider === "url";

  return {
    provider,
    isConfigured,
    uploadAvailable: provider !== "url" && isConfigured,
    options: imageStorageProviderOptions,
    note: getPlanNote(provider, isConfigured),
  };
}

export async function uploadImageFile(
  file: File,
  purpose: ImageUploadPurpose = "site",
): Promise<UploadedImageResult> {
  validateImageFile(file);

  const provider = getConfiguredProvider();

  if (provider === "url") {
    throw new Error("URL mode accepts pasted image links only.");
  }

  return uploadToLocalStorage(file, purpose);
}

function validateImageFile(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("Choose an image file first.");
  }

  const maxSizeMb = Number(process.env.IMAGE_UPLOAD_MAX_MB ?? 5);
  const maxSize = Number.isFinite(maxSizeMb) && maxSizeMb > 0 ? maxSizeMb : 5;

  if (file.size > maxSize * 1024 * 1024) {
    throw new Error(`Image must be ${maxSize}MB or smaller.`);
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Supported image types: JPG, PNG, WEBP, and GIF.");
  }
}

async function uploadToLocalStorage(
  file: File,
  purpose: ImageUploadPurpose,
): Promise<UploadedImageResult> {
  const extension = getFileExtension(file);
  const storageKey = createStorageKey(file.name, purpose, extension);
  const uploadDir = getLocalUploadDirectory();
  const targetPath = path.join(uploadDir, storageKey);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

  return {
    url: `${getLocalPublicBaseUrl()}/${storageKey.replaceAll(path.sep, "/")}`,
    provider: "local",
    storageKey,
  };
}

function getPlanNote(provider: ImageStorageProvider, isConfigured: boolean) {
  if (provider === "url") {
    return "URL mode is active. Image links can be pasted; device upload is disabled in this mode.";
  }

  if (isConfigured) {
    return "Device upload is ready for admin image fields.";
  }

  return "Selected image provider needs server-side environment variables.";
}

function getFileExtension(file: File) {
  return allowedMimeTypes.get(file.type) ?? ".jpg";
}

function createStorageKey(
  originalName: string,
  purpose: ImageUploadPurpose,
  extension: string,
) {
  const today = new Date().toISOString().slice(0, 10);
  const safeName =
    originalName
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "image";

  return `${purpose}/${today}/${crypto.randomUUID()}-${safeName}${extension}`;
}

function getLocalUploadDirectory() {
  const configuredDirectory = process.env.LOCAL_UPLOAD_DIR ?? "public/uploads";
  const resolvedDirectory = path.resolve(
    path.isAbsolute(configuredDirectory)
      ? configuredDirectory
      : path.join(/*turbopackIgnore: true*/ process.cwd(), configuredDirectory),
  );

  return resolvedDirectory;
}

function getLocalPublicBaseUrl() {
  return (process.env.LOCAL_UPLOAD_PUBLIC_BASE_URL ?? "/uploads").replace(
    /\/+$/,
    "",
  );
}
export { normalizeProductImageUrls };
