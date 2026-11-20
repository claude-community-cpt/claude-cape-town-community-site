# Adding or changing a page

Every file in `src/pages/` is a page, and its name is its address:
`src/pages/speak.astro` is served at `/speak/`.

## Change the words on a page

Open the page's file and edit the text between the tags. Open a pull request.

## Add a page

1. Create `src/pages/your-page.astro`:

   ```astro
   ---
   import Base from "../layouts/Base.astro";
   import PageHead from "../components/PageHead.astro";
   ---

   <Base title="Resources" description="One sentence for Google and link previews.">
     <PageHead title="Useful things" lede="One short paragraph that says what this page is for." />

     <section class="wrap section">
       <h2 class="heading">A section</h2>
       <p class="lede">…</p>
     </section>
   </Base>
   ```

2. `Base` adds the header, footer, fonts, search-engine tags and the security
   policy. `PageHead` is the title block. Everything else comes from the
   classes in [DESIGN.md](../DESIGN.md).
3. To put it in the menu, add a line to `links` in
   `src/components/Header.astro` and to the list in `src/components/Footer.astro`.
4. Add the address to the `pages` list in `tests/site.spec.ts` so it is tested.
5. Run `npm run verify`, then open a pull request.

## Rules of thumb

- Reuse before you invent. If the style guide has it, use it.
- No colours, font sizes or spacing values written by hand. Use the tokens.
- No `style="…"` attributes and no inline `<script>`: the security policy
  blocks both. Put styles in a `<style>` block and scripts in a `<script>`
  block in the `.astro` file; the build moves them into their own files.
- Images go in `src/assets/` and are used with `<Image>` so they are resized.
- Check the page on a phone-sized window, in light and in dark.
