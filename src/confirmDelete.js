const REQUIRED_TEXT = 'Delete';
const DELETE_BUTTON_SELECTOR = 'button[data-testid="delete-page-button"]';
const MODAL_SELECTOR = '.modal-content';
const BODY_SELECTOR = '.modal-body';
const DELETE_RECURSIVELY_SELECTOR = '#deleteRecursively';
const DELETE_COMPLETELY_SELECTOR = '#deleteCompletely';

let observer = null;
let activated = false;

export default function (context) {
  console.log("confirm-delete plugin loaded");
}

export function activateDeleteConfirmation() {
  if (activated || typeof document === 'undefined') {
    return;
  }

  activated = true;
  enhanceExistingModals();

  observer = new MutationObserver(enhanceExistingModals);
  if (document.body != null) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
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
}

export function deactivateDeleteConfirmation() {
  if (!activated) {
    return;
  }

  activated = false;
  observer?.disconnect();
  observer = null;
}

function enhanceExistingModals() {
  for (const modal of document.querySelectorAll(MODAL_SELECTOR)) {
    if (!(modal instanceof HTMLElement)) {
      continue;
    }

    if (!isTargetDeleteModal(modal) || modal.querySelector('.growi-confirm-delete') != null) {
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

function isTargetDeleteModal(modal) {
  return (
    modal.querySelector(DELETE_RECURSIVELY_SELECTOR) instanceof HTMLInputElement &&
    modal.querySelector(DELETE_COMPLETELY_SELECTOR) instanceof HTMLInputElement
  );
}

function createConfirmationPanel(deleteButton) {
  const panel = document.createElement('div');
  panel.className = 'growi-confirm-delete';

  const title = document.createElement('div');
  title.className = 'growi-confirm-delete__title';
  title.textContent = 'Type "Delete" to enable the delete button.';

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

  const sync = () => {
    const ready = normalizeText(input.value) === REQUIRED_TEXT;
    deleteButton.disabled = !ready;
    status.textContent = ready
      ? 'The delete button is ready.'
      : 'Type "Delete" to enable the button.';
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

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}
