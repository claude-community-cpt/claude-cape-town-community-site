# WhatsApp group requests

The WhatsApp invite link is never published. Instead, the Join page has a short
form: a visitor sends their name and number, and an ambassador messages them
the link on WhatsApp.

## How it is set up

The form on the Join page posts to the Google Form **Cape Town Claude Community
WhatsApp group join request**. Whoever owns that Google Form sees the requests
in its Responses tab, and gets an email for each one if "Get email
notifications for new responses" is turned on there (Responses, three-dot
menu). Share the form with the other ambassadors as editors so they can see the
requests too. Nobody else.

The Google Form has three questions: Your name, WhatsApp number, and "How did
you find us?" (multiple choice). Its ID and the three `entry` numbers are in
`"whatsapp-form"` in `src/scripts/form-ids.ts`.

If you change the Google Form:

- Keep "Collect email addresses" set to "Do not collect" and "Limit to 1
  response" off (Settings, Responses). Either makes Google ask visitors to
  sign in, and it then refuses every request from the site while the visitor
  still sees "Thanks".
- If you rename or add a choice under "How did you find us?", change the
  matching `<option value="...">` in `src/pages/join.astro` to the same words.
  Google throws away a request whose choice it does not recognise, and the
  visitor still sees "Thanks".
- If you delete and re-create a question, its `entry` number changes. Read the
  new one from the form's page source, or give the form's link to Claude Code
  and ask it to update the site.
- If you empty the `id` in `form-ids.ts`, the Join page hides the form and says
  "ask an ambassador at an event" instead.

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
