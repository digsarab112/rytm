import "server-only";

import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { normalizeProductImageUrls } from "@/lib/catalog/product-images";

export type ImageStorageProvider =
  | "url"
  | "cloudinary"
  | "uploadthing"
  | "supabase"
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
  {
    provider: "cloudinary",
    label: "Cloudinary",
    launchReady: true,
    requiresServerUpload: true,
    note: "Uploads to Cloudinary when cloud name, API key, and API secret are set.",
  },
  {
    provider: "supabase",
    label: "Supabase Storage",
    launchReady: true,
    requiresServerUpload: true,
    note: "Uploads to a public Supabase Storage bucket using the server-side service role key.",
  },
  {
    provider: "uploadthing",
    label: "UploadThing",
    launchReady: true,
    requiresServerUpload: true,
    note: "Uploads to UploadThing through the server-side UTApi when UPLOADTHING_TOKEN is set.",
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
    provider === "url" ||
    (provider === "cloudinary" &&
      Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
      Boolean(process.env.CLOUDINARY_API_KEY) &&
      Boolean(process.env.CLOUDINARY_API_SECRET)) ||
    (provider === "supabase" &&
      Boolean(process.env.SUPABASE_URL) &&
      Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
      Boolean(process.env.SUPABASE_STORAGE_BUCKET)) ||
    (provider === "uploadthing" && Boolean(process.env.UPLOADTHING_TOKEN)) ||
    false;

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

  if (provider === "cloudinary") {
    return uploadToCloudinary(file, purpose);
  }

  if (provider === "supabase") {
    return uploadToSupabaseStorage(file, purpose);
  }

  if (provider === "uploadthing") {
    return uploadToUploadThing(file);
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

async function uploadToCloudinary(
  file: File,
  purpose: ImageUploadPurpose,
): Promise<UploadedImageResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are incomplete.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = [process.env.CLOUDINARY_FOLDER ?? "rytm", purpose]
    .filter(Boolean)
    .join("/");
  const signature = signCloudinaryParameters({ folder, timestamp }, apiSecret);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed.");
  }

  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
  };

  if (!payload.secure_url) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return {
    url: payload.secure_url,
    provider: "cloudinary",
    storageKey: payload.public_id,
  };
}

async function uploadToSupabaseStorage(
  file: File,
  purpose: ImageUploadPurpose,
): Promise<UploadedImageResult> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    throw new Error("Supabase Storage credentials are incomplete.");
  }

  const extension = getFileExtension(file);
  const storageKey = createStorageKey(file.name, purpose, extension);
  const endpoint = `${supabaseUrl}/storage/v1/object/${bucket}/${storageKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type,
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    throw new Error("Supabase Storage upload failed.");
  }

  return {
    url: getSupabasePublicUrl(supabaseUrl, bucket, storageKey),
    provider: "supabase",
    storageKey,
  };
}

async function uploadToUploadThing(
  file: File,
): Promise<UploadedImageResult> {
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error("UploadThing token is missing.");
  }

  const { UTApi } = await import("uploadthing/server");
  const utapi = new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
  });
  const result = await utapi.uploadFiles(file, {
    acl: "public-read",
    contentDisposition: "inline",
  });

  if (result.error) {
    throw new Error(result.error.message || "UploadThing upload failed.");
  }

  if (!result.data?.ufsUrl && !result.data?.url) {
    throw new Error("UploadThing did not return an image URL.");
  }

  return {
    url: result.data.ufsUrl || result.data.url,
    provider: "uploadthing",
    storageKey: result.data.key,
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

function signCloudinaryParameters(
  parameters: Record<string, string>,
  apiSecret: string,
) {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

function getSupabasePublicUrl(
  supabaseUrl: string,
  bucket: string,
  storageKey: string,
) {
  const baseUrl =
    process.env.SUPABASE_STORAGE_PUBLIC_URL?.replace(/\/+$/, "") ??
    `${supabaseUrl}/storage/v1/object/public/${bucket}`;

  return `${baseUrl}/${storageKey}`;
}

export { normalizeProductImageUrls };
