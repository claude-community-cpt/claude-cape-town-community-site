# WhatsApp group requests

The WhatsApp invite link is never published. Instead, the Join page has a short
form: a visitor sends their name and number, and an ambassador messages them
the link on WhatsApp.

## Turning the form on (once)

The form stays hidden, and the page says "ask an ambassador at an event", until
it has a Google Form to post to.

1. At [forms.google.com](https://forms.google.com), create a form called
   **WhatsApp group request** with three "Short answer" questions, in this order:
   1. Your name (required)
   2. WhatsApp number (required)
   3. How did you find us?
2. In **Settings**, leave "Collect email addresses" off and "Limit to 1
   response" off. Either would make visitors sign in to Google, and the site's
   form would stop working.
3. In **Responses**, open the three-dot menu and turn on "Get email
   notifications for new responses". Whoever owns the form gets an email for
   each request.
4. Share the form (the person icon, "Add editors") with the other ambassadors
   so they can see the requests too. Nobody else.
5. Click **Send**, copy the link, and open it. In the page source, find the
   form ID (the long text after `/forms/d/e/` in the link) and the three
   `entry.` numbers, one per question.
6. Put them in `"whatsapp-form"` in `src/scripts/form-ids.ts` and open a pull
   request. Or give the link to Claude Code and ask it to do this step.

## Answering a request

1. Open the email, or the form's Responses tab.
2. Message the person on WhatsApp with the group's invite link. If the request
   looks like spam, ignore it.
3. Delete the response from the form (Responses, Individual, the bin icon).
   The [privacy notice](../src/pages/privacy.astro) promises this.

## Rules

- These requests are personal information. Keep them in the Google Form and
  nowhere else: no spreadsheets, no exports, nothing in this repository.
- Use a number only to send that person the link. Do not add it to any other
  list or pass it to anyone outside the ambassadors.
- If the form's questions change, update the privacy notice to match.
