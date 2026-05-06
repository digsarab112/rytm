# Image Storage Setup

Admin image uploads are configured for the same VPS filesystem.

```bash
IMAGE_STORAGE_PROVIDER=local
IMAGE_UPLOAD_MAX_MB=5
LOCAL_UPLOAD_DIR=public/uploads
LOCAL_UPLOAD_PUBLIC_BASE_URL=/uploads
```

Uploaded files are ignored by git through `public/uploads/`. On production,
make this directory persistent and writable by the Node.js process. Do not wipe
it during deployments.

## URL-Only Mode

```bash
IMAGE_STORAGE_PROVIDER=url
```

Admins can paste image links, but device upload is disabled in this mode.
