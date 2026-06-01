const REQUIRED_TEXT = 'Delete';
const DELETE_BUTTON_SELECTOR = 'button[data-testid="delete-page-button"]';
const MODAL_SELECTOR = '.modal-content';
const BODY_SELECTOR = '.modal-body';
const DELETE_RECURSIVELY_SELECTOR = '#deleteRecursively';
const DELETE_COMPLETELY_SELECTOR = '#deleteCompletely';
const DELETE_OPTION_SELECTOR = `${DELETE_RECURSIVELY_SELECTOR}, ${DELETE_COMPLETELY_SELECTOR}`;
const PAGE_TREE_CONTROL_BUTTON_SELECTOR =
  '[data-testid="open-page-item-control-btn"] button, .btn-page-item-control';
const PAGE_TREE_MENU_SELECTOR = '[data-testid="page-item-control-menu"]';
const PAGE_TREE_DELETE_BUTTON_SELECTOR = 'button[data-testid="open-page-delete-modal-btn"]';
const PAGE_TREE_ITEM_SELECTOR =
  '[data-testid="grw-pagetree-item-container"], li[id^="grw-pagetree-list-"]';
const PAGE_TREE_CHILD_INDICATOR_SELECTOR = 'button.btn-triangle, .grw-count-badge';

let observer: MutationObserver | null = null;
let activated = false;
let activePageTreeItem: HTMLElement | null = null;

export function activateDeleteConfirmation(): void {
  if (activated || typeof document === 'undefined') {
    return;
  }

  activated = true;
  enhanceExistingModals();
  enhanceExistingPageTreeMenus();
  document.addEventListener('click', handleDocumentClick, true);

  observer = new MutationObserver(() => {
    enhanceExistingModals();
    enhanceExistingPageTreeMenus();
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
  activePageTreeItem = null;
  document.removeEventListener('click', handleDocumentClick, true);
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

function enhanceExistingPageTreeMenus(): void {
  const hideDelete = activePageTreeItem instanceof HTMLElement && pageTreeItemHasChildren(activePageTreeItem);

  for (const menu of document.querySelectorAll(PAGE_TREE_MENU_SELECTOR)) {
    if (!(menu instanceof HTMLElement)) {
      continue;
    }

    const deleteButton = menu.querySelector(PAGE_TREE_DELETE_BUTTON_SELECTOR);
    if (!(deleteButton instanceof HTMLElement)) {
      continue;
    }

    deleteButton.hidden = hideDelete;

    const divider = deleteButton.previousElementSibling;
    if (divider instanceof HTMLElement && divider.classList.contains('dropdown-divider')) {
      divider.hidden = hideDelete;
    }
  }
}

function handleDocumentClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) {
    return;
  }

  const controlButton = event.target.closest(PAGE_TREE_CONTROL_BUTTON_SELECTOR);
  if (!(controlButton instanceof HTMLElement)) {
    return;
  }

  const pageTreeItem = controlButton.closest(PAGE_TREE_ITEM_SELECTOR);
  activePageTreeItem = pageTreeItem instanceof HTMLElement ? pageTreeItem : null;

  queueMicrotask(() => {
    if (activated) {
      enhanceExistingPageTreeMenus();
    }
  });
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

function pageTreeItemHasChildren(pageTreeItem: HTMLElement): boolean {
  return pageTreeItem.querySelector(PAGE_TREE_CHILD_INDICATOR_SELECTOR) != null;
}

function createConfirmationPanel(deleteButton: HTMLButtonElement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'growi-confirm-delete';

  const title = document.createElement('div');
  title.className = 'growi-confirm-delete__title';
  title.textContent = '"ページを削除する" ボタンをを有効にするには "Delete" と入力してください。';

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
