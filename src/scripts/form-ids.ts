/* Which Google Form each form on the site posts to. README.md ("Forms") says
   where the submissions end up. These IDs are public: they are in the page
   source of the Google Forms themselves. */

export const GOOGLE_FORMS: Record<string, { id: string; entries: Record<string, string> }> = {
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
  // The WhatsApp request form on the Join page. While `id` is empty the page
  // shows "ask an ambassador" instead of the form. docs/whatsapp-requests.md
  // says how to create the Google Form and fill these in.
  "whatsapp-form": {
    id: "",
    entries: { name: "", phone: "", about: "" },
  },
};

/** True once a form has a Google Form to post to. */
export const isLive = (formId: string) => !!GOOGLE_FORMS[formId]?.id;
