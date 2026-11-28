/* Sends the site's forms (Give a talk, Host or support an event, WhatsApp
   request) to Google Forms from the page. No API key lives in the site.
   The form IDs are in form-ids.ts. */

import { GOOGLE_FORMS } from "./form-ids";

const loadedAt = Date.now();
const value = (form: HTMLFormElement, name: string) =>
  (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? "";

/** Bots fill hidden fields and submit within a second or two. People do neither. */
function looksLikeSpam(form: HTMLFormElement): boolean {
  return value(form, "company_url") !== "" || Date.now() - loadedAt < 2500;
}

const senders: Record<string, (form: HTMLFormElement) => Promise<void>> = {};

for (const [formId, config] of Object.entries(GOOGLE_FORMS)) {
  if (!config.id) continue;
  senders[formId] = async (form) => {
    const body = new FormData();
    for (const [field, entry] of Object.entries(config.entries)) body.append(`entry.${entry}`, value(form, field));
    // no-cors: the reply cannot be read, so only a network failure counts as an error.
    await fetch(`https://docs.google.com/forms/d/e/${config.id}/formResponse`, { method: "POST", mode: "no-cors", body });
  };
}

for (const [formId, send] of Object.entries(senders)) {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  if (!form || form.dataset.wired) continue;
  form.dataset.wired = "true";
  const done = document.getElementById(`${formId}-done`);
  const error = document.getElementById(`${formId}-error`);
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      const bad = form.querySelector<HTMLInputElement>(":invalid");
      bad?.focus();
      bad?.reportValidity();
      return;
    }
    if (error) error.hidden = true;
    const label = button?.textContent ?? "";
    if (button) {
      button.disabled = true;
      button.textContent = button.dataset.busy ?? "Sending…";
    }
    try {
      if (!looksLikeSpam(form)) await send(form);
      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.tabIndex = -1;
        done.focus();
      }
    } catch {
      if (error) error.hidden = false;
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = label;
      }
    }
  });
}
