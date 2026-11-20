/* Sends the site's four forms from the page. No API key lives in the site.
     Newsletter and Join  -> Kit (app.kit.com) public form endpoints
     Speak and Partner    -> Google Forms
   README.md ("Forms") says where the submissions end up. */

const KIT_NEWSLETTER = "10030128";
const KIT_JOIN = "10030161";

const GOOGLE_FORMS: Record<string, { id: string; entries: Record<string, string> }> = {
  "speak-form": {
    id: "1FAIpQLSeNXryk3MagMWZH1J4kcJOTFldGqX17aKOpDQqDPzDNbGpUsQ",
    entries: { name: "2005313327", email: "1908383360", topic: "1196580280" },
  },
  "partner-form": {
    id: "1FAIpQLScHiLlRrzdcGs9nMdKMrGbwuF21A0K7J457hC87EQnkj7GmGw",
    entries: {
      org: "321525456",
      name: "1241870961",
      email: "1999320620",
      phone: "1156286795",
      website: "219640878",
      how: "109026469",
      message: "527276179",
    },
  },
};

const loadedAt = Date.now();
const value = (form: HTMLFormElement, name: string) =>
  (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? "";

/** Bots fill hidden fields and submit within a second or two. People do neither. */
function looksLikeSpam(form: HTMLFormElement): boolean {
  return value(form, "company_url") !== "" || Date.now() - loadedAt < 2500;
}

async function kit(formId: string, body: FormData) {
  const res = await fetch(`https://app.kit.com/forms/${formId}/subscriptions`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
  const json = await res.json();
  if (json?.status !== "success") throw new Error("Kit rejected the submission");
}

const senders: Record<string, (form: HTMLFormElement) => Promise<void>> = {
  async "nl-form"(form) {
    const body = new FormData();
    body.append("email_address", value(form, "email"));
    body.append("fields[first_name]", value(form, "name"));
    await kit(KIT_NEWSLETTER, body);
  },
  async "join-form"(form) {
    const body = new FormData();
    body.append("email_address", value(form, "email"));
    body.append("fields[first_name]", value(form, "name"));
    body.append("fields[whatsapp]", value(form, "phone"));
    body.append("fields[builds]", value(form, "about"));
    body.append("fields[why_join]", value(form, "why"));
    await kit(KIT_JOIN, body);
    // Only people who tick the box are added to the newsletter (double opt-in).
    if ((form.elements.namedItem("newsletter") as HTMLInputElement | null)?.checked) {
      const nl = new FormData();
      nl.append("email_address", value(form, "email"));
      nl.append("fields[first_name]", value(form, "name"));
      await kit(KIT_NEWSLETTER, nl).catch(() => {}); // the application is already in
    }
  },
};

for (const [formId, config] of Object.entries(GOOGLE_FORMS)) {
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
