# growi-plugin-confirm-delete-text

GROWI delete dialogs now require typing `Delete` before the delete button becomes active, and the page editor button now gets an injected `編集を有効にする` checkbox next to it that must be checked first.

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
- The plugin injects an `編集を有効にする` checkbox next to the editor button
- The editor button stays disabled until that checkbox is checked
- `deactivate` stops the MutationObserver
