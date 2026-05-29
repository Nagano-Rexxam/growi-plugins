# growi-plugin-confirm-delete-text

GROWI delete dialogs now require typing `Delete` before the delete button becomes active.

## Structure

- `client-entry.tsx`: entry point that registers `window.pluginActivators`
- `src/confirmDelete.ts`: modal detection and confirmation logic
- `src/styles.css`: styles for the confirmation UI
- `vite.config.ts`: build configuration

## Development

```bash
npm install
npm run build
```

To rebuild on changes:

```bash
npm run dev
```

## Behavior

- When a page delete modal appears, the plugin adds a confirmation input
- The delete button stays disabled until the input value is exactly `Delete`
- `deactivate` stops the MutationObserver
