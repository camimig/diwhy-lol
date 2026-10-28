# DIWHY

The website for *DIWHY: An Horatian Lexicon on Improvisation, Neglect and
Dysfunctionality*: a visual lexicon with 15 image categories, selection and ZIP
downloads, and a slideshow of the printed publication.

Live site: <https://diwhy.lol/>

## Repository layout

```text
public/                     Deploy this folder
  index.html                Page content and gallery image order
  assets/
    css/style.css           Layout, typography, tooltips, and dialogs
    js/
      gallery.js            Gallery layout, category tooltips, and ZIP downloads
      about.js              About dialog
      print.js              Print dialog
      slideshow.js          Publication slideshow
    images/
      <category>/           Gallery images, grouped by their original category
      print/                Publication photographs
      ezgif-maker.webp      About animation
```

## Preview locally

From the repository root, run:

```sh
python3 -m http.server 8000 --directory public
```

Open <http://localhost:8000>. Stop the server with Ctrl+C.

## Edit the site

- Update page text and the gallery image order in `public/index.html`.
- Edit the appearance in `public/assets/css/style.css` and interactions in
  `public/assets/js/`.
- Put new gallery images in the matching category folder and add their `<img>`
  entries to the gallery in `public/index.html`. The immediate parent folder
  supplies the category name used by tooltips and ZIP downloads.
- Edit tooltip descriptions in `public/assets/js/gallery.js` and the corresponding
  category text in the About section of `public/index.html`.

The site is static and has no build step. Adobe Fonts and JSZip load from their
existing external services, so fonts and ZIP downloads require internet access.

## Deploy to Cloudflare Pages

### Automatic deployment

The [deployment workflow](.github/workflows/deploy.yml) deploys `public/` to the
existing **diwhy** Cloudflare Pages project when site files change on `main`.
Changes to the workflow also trigger a deployment; documentation-only changes do
not. There is no build step.

The workflow requires two
[GitHub Actions repository secrets](https://github.com/camimig/diwhy-lol/settings/secrets/actions):

- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID for the existing `diwhy`
  project (`59ce6a5bb4e0bff538f2f742cf3b876f`).
- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with **Account → Cloudflare Pages
  → Edit**, restricted to that account. Create it in
  [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens), then
  save its value directly in the GitHub secret.

Once configured, push site changes to `main` and follow progress in
[GitHub Actions](https://github.com/camimig/diwhy-lol/actions/workflows/deploy.yml).
To deploy manually or retry after updating secrets, select **Run workflow** on
that page with the `main` branch selected. Successful deployments update
<https://diwhy.lol/> and <https://www.diwhy.lol/>.

Deployments run one at a time. The current deployment finishes before a newer
one begins. A failed deployment leaves the last successful version live.

See Cloudflare's
[continuous integration guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

### Manual deployment

With Node.js installed and Wrangler authenticated to the Cloudflare account that
owns the `diwhy` project:

```sh
npx wrangler pages deploy public --project-name=diwhy --branch=main
```

Alternatively, upload the `public/` folder in the existing Pages project's
dashboard. For ZIP uploads, archive the **contents** of `public/` so `index.html`
is at the archive root.
