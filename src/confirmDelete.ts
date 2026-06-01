const REQUIRED_TEXT = 'Delete';
const DELETE_BUTTON_SELECTOR = 'button[data-testid="delete-page-button"]';
const MODAL_SELECTOR = '.modal-content';
const BODY_SELECTOR = '.modal-body';
const DELETE_RECURSIVELY_SELECTOR = '#deleteRecursively';
const DELETE_COMPLETELY_SELECTOR = '#deleteCompletely';
const DELETE_OPTION_SELECTOR = `${DELETE_RECURSIVELY_SELECTOR}, ${DELETE_COMPLETELY_SELECTOR}`;
const FOOTER_META_SELECTOR = 'footer .page-meta p';
const FOOTER_AUTHOR_LINK_SELECTOR = 'span[role="link"], a[href^="/user/"]';

let observer: MutationObserver | null = null;
let activated = false;

export function activateDeleteConfirmation(): void {
  if (activated || typeof document === 'undefined') {
    return;
  }

  activated = true;
  enhanceExistingModals();
  cleanFooterMetadata();

  observer = new MutationObserver(() => {
    enhanceExistingModals();
    cleanFooterMetadata();
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
