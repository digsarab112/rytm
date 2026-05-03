# Image Storage Setup

Admin image uploads work through one server-side setting:

```bash
IMAGE_STORAGE_PROVIDER=local
```

No customer page shows storage status. If a provider is missing credentials, the admin upload button shows the issue and URL fields still work.

## Local Or Hostinger Filesystem

Use this for immediate testing:

```bash
IMAGE_STORAGE_PROVIDER=local
IMAGE_UPLOAD_MAX_MB=5
LOCAL_UPLOAD_DIR=public/uploads
LOCAL_UPLOAD_PUBLIC_BASE_URL=/uploads
```

Uploaded files are ignored by git through `public/uploads/`.

## Cloudinary

```bash
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=rytm
```

The app uploads from the admin panel and saves the returned Cloudinary URL.

## Supabase Storage

Create a public Storage bucket, then set:

```bash
IMAGE_STORAGE_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
SUPABASE_STORAGE_PUBLIC_URL=
```

`SUPABASE_STORAGE_PUBLIC_URL` is optional. If omitted, the app uses the normal public bucket URL.

## UploadThing

Create an UploadThing app, copy the server token, then set:

```bash
IMAGE_STORAGE_PROVIDER=uploadthing
UPLOADTHING_TOKEN=
```

The app uploads from the admin panel through the server-side UploadThing API and saves the returned public URL.

## URL-Only Mode

```bash
IMAGE_STORAGE_PROVIDER=url
```

Admins can paste image links, but device upload is disabled in this mode.
