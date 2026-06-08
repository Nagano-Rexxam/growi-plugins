const REQUIRED_TEXT = 'Delete';
const DELETE_BUTTON_SELECTOR = 'button[data-testid="delete-page-button"]';
const EDITOR_BUTTON_SELECTOR = 'button[data-testid="editor-button"]';
const EDITOR_MODE_MANAGER_SELECTOR =
  'fieldset[data-testid="grw-page-editor-mode-manager"], #grw-page-editor-mode-manager';
const EDITOR_ENABLE_PANEL_CLASS = 'growi-enable-editor';
const EDITOR_ENABLE_CHECKBOX_ID = 'growi-enable-editor-checkbox';
const MODAL_SELECTOR = '.modal-content';
const BODY_SELECTOR = '.modal-body';
const DELETE_RECURSIVELY_SELECTOR = '#deleteRecursively';
const DELETE_COMPLETELY_SELECTOR = '#deleteCompletely';
const DELETE_OPTION_SELECTOR = `${DELETE_RECURSIVELY_SELECTOR}, ${DELETE_COMPLETELY_SELECTOR}`;
const FOOTER_META_SELECTOR = 'footer .page-meta p';
const FOOTER_AUTHOR_LINK_SELECTOR = 'span[role="link"], a[href^="/user/"]';

let observer: MutationObserver | null = null;
let activated = false;
let navigationListenersAttached = false;
let lastPageKey = getCurrentPageKey();

export function activateDeleteConfirmation(): void {
  if (activated || typeof document === 'undefined') {
    return;
  }

  activated = true;
  attachNavigationListeners();
  enhanceExistingModals();
  cleanFooterMetadata();
  syncEditorModeManagers();

  observer = new MutationObserver(() => {
    enhanceExistingModals();
    cleanFooterMetadata();
    syncEditorModeManagers();
  });

  if (document.body != null) {
    observer.observe(document.body, { childList: true, subtree: true });
    return;
  }

  window.addEventListener(
    'DOMContentLoaded',
    () => {
      if (activated && observer != null && document.body != null) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    },
    { once: true },
  );
}

export function deactivateDeleteConfirmation(): void {
  if (!activated) {
    return;
  }

  activated = false;
  observer?.disconnect();
  observer = null;
}

function attachNavigationListeners(): void {
  if (navigationListenersAttached || typeof window === 'undefined') {
    return;
  }

  const history = window.history as History & {
    __growiPluginLocationChangePatched?: boolean;
  };

  if (!history.__growiPluginLocationChangePatched) {
    const wrapHistoryMethod = (methodName: 'pushState' | 'replaceState'): void => {
      const original = history[methodName];
      history[methodName] = function patchedHistoryMethod(...args: Parameters<History['pushState']>): void {
        original.apply(this, args);
        window.dispatchEvent(new Event('growi-plugin-locationchange'));
      } as History['pushState'];
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');
    history.__growiPluginLocationChangePatched = true;
  }

  window.addEventListener('popstate', handleLocationChange);
  window.addEventListener('hashchange', handleLocationChange);
  window.addEventListener('growi-plugin-locationchange', handleLocationChange);
  navigationListenersAttached = true;
}

function handleLocationChange(): void {
  const currentPageKey = getCurrentPageKey();
  if (currentPageKey === lastPageKey) {
    return;
  }

  lastPageKey = currentPageKey;
  syncEditorModeManagers(true);
}

function syncEditorModeManagers(forceReset = false): void {
  const currentPageKey = getCurrentPageKey();

  for (const manager of document.querySelectorAll(EDITOR_MODE_MANAGER_SELECTOR)) {
    if (!(manager instanceof HTMLElement)) {
      continue;
    }

    const editorButton = manager.querySelector(EDITOR_BUTTON_SELECTOR);
    if (!(editorButton instanceof HTMLButtonElement)) {
      continue;
    }

    let panel = manager.querySelector(`.${EDITOR_ENABLE_PANEL_CLASS}`);
    if (!(panel instanceof HTMLElement)) {
      panel = createEditorEnablePanel();
      editorButton.insertAdjacentElement('afterend', panel);
    }

    const checkbox = getEditorEnableCheckbox(panel);
    if (checkbox == null) {
      continue;
    }

    const pageKeyChanged = panel.dataset.pageKey !== currentPageKey;
    if (forceReset || pageKeyChanged) {
      checkbox.checked = false;
    }

    panel.dataset.pageKey = currentPageKey;
    syncEditorModeButtonState(editorButton, checkbox);
  }
}

function createEditorEnablePanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = EDITOR_ENABLE_PANEL_CLASS;
  panel.dataset.testid = 'growi-enable-editor';

  const checkbox = document.createElement('input');
  checkbox.className = 'growi-enable-editor__checkbox';
  checkbox.id = EDITOR_ENABLE_CHECKBOX_ID;
  checkbox.type = 'checkbox';

  const label = document.createElement('label');
  label.className = 'growi-enable-editor__label';
  label.htmlFor = EDITOR_ENABLE_CHECKBOX_ID;
  label.textContent = '編集を有効にする';

  const text = document.createElement('span');
  text.className = 'growi-enable-editor__text';
  text.textContent = '編集を有効にする';

  const sync = (): void => {
    const editorButton = panel.parentElement?.querySelector(EDITOR_BUTTON_SELECTOR);
    if (!(editorButton instanceof HTMLButtonElement)) {
      return;
    }

    syncEditorModeButtonState(editorButton, checkbox);
  };

  checkbox.addEventListener('change', sync);
  checkbox.addEventListener('click', sync);
  label.append(checkbox, text);
  panel.append(label);

  return panel;
}

function getEditorEnableCheckbox(panel: HTMLElement): HTMLInputElement | null {
  const checkbox = panel.querySelector('input[type="checkbox"]');
  return checkbox instanceof HTMLInputElement ? checkbox : null;
}

function syncEditorModeButtonState(editorButton: HTMLButtonElement, checkbox: HTMLInputElement): void {
  const enabled = checkbox.checked;
  editorButton.disabled = !enabled;
  editorButton.toggleAttribute('aria-disabled', !enabled);

  if (enabled) {
    editorButton.removeAttribute('title');
    return;
  }

  editorButton.title = '「編集を有効にする」をチェックすると編集できます。';
}

function getCurrentPageKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function enhanceExistingModals(): void {
  for (const modal of document.querySelectorAll(MODAL_SELECTOR)) {
    if (!(modal instanceof HTMLElement)) {
      continue;
    }

    if (!isTargetDeleteModal(modal)) {
      continue;
    }

    hideDeleteOptions(modal);

    if (modal.querySelector('.growi-confirm-delete') != null) {
      continue;
    }

    const deleteButton = modal.querySelector(DELETE_BUTTON_SELECTOR);
    const modalBody = modal.querySelector(BODY_SELECTOR);
    if (!(deleteButton instanceof HTMLButtonElement) || !(modalBody instanceof HTMLElement)) {
      continue;
    }

    modalBody.appendChild(createConfirmationPanel(deleteButton));
  }
}

function cleanFooterMetadata(): void {
  for (const paragraph of document.querySelectorAll(FOOTER_META_SELECTOR)) {
    if (!(paragraph instanceof HTMLElement)) {
      continue;
    }

    const authorLinks = paragraph.querySelectorAll(FOOTER_AUTHOR_LINK_SELECTOR);
    if (authorLinks.length === 0) {
      continue;
    }

    const byTextNode = Array.from(paragraph.childNodes).find((node) => {
      return node.nodeType === Node.TEXT_NODE && node.textContent?.includes('by') === true;
    });

    if (byTextNode != null) {
      byTextNode.textContent = byTextNode.textContent?.replace(/\s*by\s*$/, '') ?? '';
    }

    for (const authorLink of authorLinks) {
      authorLink.remove();
    }

    const trailingTextNodes = Array.from(paragraph.childNodes).filter((node) => {
      return node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '';
    });
    for (const node of trailingTextNodes) {
      if (node.parentNode === paragraph) {
        node.remove();
      }
    }
  }
}

function isTargetDeleteModal(modal: HTMLElement): boolean {
  return (
    modal.querySelector(DELETE_RECURSIVELY_SELECTOR) instanceof HTMLInputElement &&
    modal.querySelector(DELETE_COMPLETELY_SELECTOR) instanceof HTMLInputElement
  );
}

function hideDeleteOptions(modal: HTMLElement): void {
  for (const checkbox of modal.querySelectorAll<HTMLInputElement>(DELETE_OPTION_SELECTOR)) {
    checkbox.checked = false;
    checkbox.removeAttribute('checked');

    const formCheck = checkbox.closest('.form-check');
    if (formCheck instanceof HTMLElement) {
      formCheck.hidden = true;
    }
  }
}

function createConfirmationPanel(deleteButton: HTMLButtonElement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'growi-confirm-delete';

  const title = document.createElement('div');
  title.className = 'growi-confirm-delete__title';
  title.textContent = '"ページを削除する" ボタンを有効にするには "Delete" と入力してください。';

  const input = document.createElement('input');
  input.className = 'growi-confirm-delete__input';
  input.type = 'text';
  input.placeholder = 'Delete';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('aria-label', 'Delete confirmation text');

  const status = document.createElement('div');
  status.className = 'growi-confirm-delete__status';

  const sync = (): void => {
    const ready = normalizeText(input.value) === REQUIRED_TEXT;
    deleteButton.disabled = !ready;
    status.textContent = ready
      ? '削除ボタンは有効です。'
      : '有効にするには "Delete" と入力してください。';
    panel.dataset.state = ready ? 'ready' : 'waiting';
  };

  input.addEventListener('input', sync);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  });

  panel.append(title, input, status);
  sync();
  return panel;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
