# Changelog

## v2.1.0

- Improved the mobile header by moving the language switcher into the top
  slogan bar on narrow screens.
- Reduced tablet/mobile scroll jank by avoiding backdrop blur on the sticky
  public header below desktop widths and relaxing carousel touch handling.
- Disabled homepage hero drift animation on coarse pointer devices.

## v2.0.0

- Prepared the app for single VPS deployment with local PostgreSQL and local
  image uploads.
- Replaced LiqPay checkout with Monopay invoice checkout and webhook handling.
- Removed optional paid image storage providers from the runtime upload flow.
- Updated deployment and environment documentation for production launch.

## v1.0.0

- Baseline GitHub version before the VPS launch cleanup and Monopay migration.

## Rollback

Use Git tags to move between versions:

```bash
git fetch --tags
git checkout v1.0.0
git checkout v2.0.0
git checkout v2.1.0
```

For server deployment, restart the production process after checking out the
target tag and rebuilding.
