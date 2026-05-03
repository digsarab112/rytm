"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud } from "lucide-react";

import { uploadAdminImage } from "@/lib/admin/image-upload-actions";
import { VisualMedia } from "@/components/home/visual-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VisualTone } from "@/types/store";

type AdminImagePurpose = "product" | "category" | "site" | "hero" | "logo";

type AdminImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  purpose: AdminImagePurpose;
  tone?: VisualTone;
  previewClassName?: string;
  helpText?: string;
};

const acceptedImageTypes = ".jpg,.jpeg,.png,.webp,.gif";

export function AdminImageUploadField({
  label,
  value,
  onChange,
  purpose,
  tone = "cream",
  previewClassName = "aspect-[16/7]",
  helpText = "Paste an image URL or upload from your device.",
}: AdminImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function uploadSelectedFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("purpose", purpose);
    setMessage("");

    startTransition(async () => {
      const result = await uploadAdminImage(formData);

      if (result.ok) {
        onChange(result.url);
        setMessage("Image uploaded.");
        return;
      }

      setMessage(result.error);
    });
  }

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-semibold text-foreground">
        {label}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={value}
            placeholder="/uploads/... or https://..."
            onChange={(event) => onChange(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud />
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedImageTypes}
        className="sr-only"
        onChange={(event) => {
          uploadSelectedFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <VisualMedia
        imageUrl={value}
        label={label}
        tone={tone}
        className={`${previewClassName} rounded-lg border border-border shadow-sm`}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        {message || helpText}
      </p>
    </div>
  );
}
