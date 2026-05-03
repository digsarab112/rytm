"use client";

import { useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { uploadAdminImage } from "@/lib/admin/image-upload-actions";
import { ProductVisual } from "@/components/home/product-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isPreviewableProductImageUrl,
  normalizeProductImageUrl,
} from "@/lib/catalog/product-images";
import type { VisualTone } from "@/types/store";

type ProductImageManagerProps = {
  images: string[];
  productName: string;
  tone: VisualTone;
  onChange: (images: string[]) => void;
};

export function ProductImageManager({
  images,
  productName,
  tone,
  onChange,
}: ProductImageManagerProps) {
  const normalizedImages = images.map(normalizeProductImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, startUploadTransition] = useTransition();

  function updateImage(index: number, value: string) {
    onChange(
      normalizedImages.map((image, currentIndex) =>
        currentIndex === index ? value : image,
      ),
    );
  }

  function addImage() {
    onChange([...normalizedImages, ""]);
  }

  function removeImage(index: number) {
    onChange(normalizedImages.filter((_, currentIndex) => currentIndex !== index));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= normalizedImages.length) {
      return;
    }

    const nextImages = [...normalizedImages];
    const currentImage = nextImages[index];
    nextImages[index] = nextImages[nextIndex];
    nextImages[nextIndex] = currentImage;
    onChange(nextImages);
  }

  function uploadImage(file: File | undefined) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("purpose", "product");
    setUploadMessage("");

    startUploadTransition(async () => {
      const result = await uploadAdminImage(formData);

      if (result.ok) {
        onChange([...normalizedImages, result.url]);
        setUploadMessage("Image uploaded and added to the end.");
        return;
      }

      setUploadMessage(result.error);
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Product images</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add image URLs in display order. The first image is used for product
            cards, cart previews, and the main gallery image.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addImage}>
            <Plus />
            Add URL
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud />
            {isUploading ? "Uploading..." : "Upload image"}
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        className="sr-only"
        onChange={(event) => {
          uploadImage(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <div className="rounded-lg border border-dashed border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
        Upload from your device or paste an image URL. The first image is used
        for product cards, cart previews, and the main gallery image.
        {uploadMessage ? (
          <span className="mt-2 block font-semibold text-primary">
            {uploadMessage}
          </span>
        ) : null}
      </div>
      {normalizedImages.length > 0 ? (
        <div className="grid gap-3">
          {normalizedImages.map((image, index) => (
            <div
              key={`product-image-${index}`}
              className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[112px_1fr_auto]"
            >
              <ProductVisual
                tone={tone}
                imageUrl={image}
                alt={`${productName} image ${index + 1}`}
                className="aspect-square"
              />
              <label className="grid content-start gap-2 text-sm font-semibold text-foreground">
                Image URL {index + 1}
                <Input
                  value={image}
                  placeholder="/placeholders/product-rose.svg or https://..."
                  onChange={(event) => updateImage(index, event.target.value)}
                  onBlur={(event) =>
                    updateImage(index, normalizeProductImageUrl(event.target.value))
                  }
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {isPreviewableProductImageUrl(image)
                    ? "Preview available"
                    : "Enter a local /public path or http(s) image URL for preview"}
                </span>
              </label>
              <div className="flex gap-2 md:grid md:content-start">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move image up"
                  disabled={index === 0}
                  onClick={() => moveImage(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Move image down"
                  disabled={index === normalizedImages.length - 1}
                  onClick={() => moveImage(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove image"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <ImagePlus className="mx-auto size-8 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            No product images yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Add at least one URL so the catalog card and product page show a
            real image. A graceful placeholder will appear until then.
          </p>
          <Button type="button" className="mt-5" onClick={addImage}>
            <Plus />
            Add first image URL
          </Button>
        </div>
      )}
    </section>
  );
}
