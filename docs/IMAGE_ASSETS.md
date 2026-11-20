# Homepage Image Asset Inventory

This inventory covers every homepage image slot. Product-card images must show
the actual product; editorial stock photos must not imply that they depict
ZORVELLAE products, staff, facilities, or clinical results.

## Inventory

| Image ID | Homepage section | Required subject | Preferred composition | Aspect ratio | Search keywords | Suggested source | Local destination | Status |
|---|---|---|---|---|---|---|---|---|
| H01 | Hero campaign | Botanical skincare editorial scene without visible product packaging | Pale leafy branch, warm beige ground, generous negative space | 1:1 desktop; 4:3 mobile | botanical skincare editorial, ivory stone, leaf shadows, premium beauty still life | [Karola G. / Pexels photo 5478211](https://www.pexels.com/photo/photo-of-white-leaves-5478211/); [license](https://www.pexels.com/license/) | `frontend/src/assets/home/hero-editorial-{720,1440}.webp` | Integrated; no product packaging or brand is depicted |
| F01 | Formulation step 01 — Cleanse | Botanical ingredients or clean plant detail | Fresh herbs arranged on a light tabletop | 3:2 | botanical ingredients macro, fresh leaves, natural skincare ingredients | [alleksana / Pexels photo 4113898](https://www.pexels.com/photo/photo-of-assorted-herbs-4113898/); [license](https://www.pexels.com/license/) | `frontend/src/assets/home/step-cleanse-{480,960}.webp` | Integrated; illustrative botanical stock photography |
| F02 | Formulation step 02 — Treat | Real serum or cream texture/application, without branded packaging | Close cream texture on a warm beige ground | 3:2 | skincare serum texture, clear gel pipette, cream texture beige | [Harriet B. / Pexels photo 14816260](https://www.pexels.com/photo/white-petal-on-yellow-background-14816260/); [license](https://www.pexels.com/license/) | `frontend/src/assets/home/step-treat-{480,960}.webp` | Integrated; texture is not a ZORVELLAE formula |
| F03 | Formulation step 03 — Hydrate | Genuine formulation materials or hands preparing a cosmetic texture | Gloved hands mixing a cream; no visible third-party branding | 3:2 | cosmetic formulation hands, skincare cream mixing, formulation glassware | [Jonathan Borba / Pexels photo 15831825](https://www.pexels.com/photo/hands-in-gloves-holding-tube-and-spoon-with-cream-15831825/); [license](https://www.pexels.com/license/) | `frontend/src/assets/home/step-hydrate-{480,960}.webp` | Integrated; illustrative stock photography, not a ZORVELLAE product or facility |
| F04 | Formulation step 04 — Protect | Everyday skincare ritual without a visible face or branded product | Close-up of hands smoothing cream over skin on a peach ground | 3:2 | skincare ritual, applying cream, warm editorial still life | [Shiny Diamond / Pexels photo 3762875](https://www.pexels.com/photo/person-applying-hand-cream-3762875/); [license](https://www.pexels.com/license/) | `frontend/src/assets/home/step-protect-{480,960}.webp` | Integrated; illustrative skincare ritual stock photography |
| S01 | Science editorial | Authentic formulation/science-related photography | Hand, dropper, and glass beaker in soft light; no visible brand | 5:4 desktop; 16:9 tablet | cosmetic formulation lab, glass dropper, formulation materials | [MART PRODUCTION / Pexels photo 8450217](https://www.pexels.com/photo/a-person-holding-a-dropper-8450217/); [license](https://www.pexels.com/license/) | `frontend/src/assets/home/science-editorial-{720,1440}.webp` | Integrated with a visible note that it is illustrative stock photography, not a ZORVELLAE facility or test |
| P01–P04 | Featured formulation cards (up to four API products) | The exact, approved product represented by each card | Product-owned pack shot on neutral background, readable accurate packaging | 4:5 | exact approved product name and pack photography | ZORVELLAE-owned/approved product photography only; stock photography is not suitable | Product-managed image URL; local `frontend/src/assets/products/<approved-product-slug>.webp` only if approved for local bundling | Pending real product photography and product approval |

## Asset review and licensing

- The repository's frontend image files are framework defaults (`vite.svg`,
  `react.svg`, and the default `hero.png`) plus interface icons; none are
  suitable brand or product photography.
- `references/zorevellae.zip` contains PDF references only, not standalone
  photos.
- Pexels' license page states its photos may be used for free, including
  commercially, and may be modified; attribution is not required. It also
  prohibits implying that a person or brand endorses a product. The selected
  images contain no visible third-party logos; the formulation/science imagery
  is described as illustrative rather than as ZORVELLAE products or facilities.
- Unsplash search/license pages were unavailable to the research fetcher during
  this review, so no Unsplash photo is selected.
- The user-provided bottle image is not integrated: its source/license is
  unknown, it has no attribution record, and its visible product labels cannot
  be matched to the current development-only catalog.

## Integrated image attribution

All selected originals are available under the [Pexels license](https://www.pexels.com/license/).
The following local WebP derivatives were resized/cropped for the listed
responsive slots:

| Local asset set | Original source | Photographer / attribution |
|---|---|---|
| `hero-editorial-{720,1440}.webp` | [Pexels photo 5478211](https://www.pexels.com/photo/photo-of-white-leaves-5478211/) | Karola G. (Kaboompics) |
| `step-cleanse-{480,960}.webp` | [Pexels photo 4113898](https://www.pexels.com/photo/photo-of-assorted-herbs-4113898/) | alleksana |
| `step-treat-{480,960}.webp` | [Pexels photo 14816260](https://www.pexels.com/photo/white-petal-on-yellow-background-14816260/) | Harriet B. |
| `step-hydrate-{480,960}.webp` | [Pexels photo 15831825](https://www.pexels.com/photo/hands-in-gloves-holding-tube-and-spoon-with-cream-15831825/) | Jonathan Borba |
| `step-protect-{480,960}.webp` | [Pexels photo 3762875](https://www.pexels.com/photo/person-applying-hand-cream-3762875/) | Shiny Diamond |
| `science-editorial-{720,1440}.webp` | [Pexels photo 8450217](https://www.pexels.com/photo/a-person-holding-a-dropper-8450217/) | MART PRODUCTION |

Featured product photography remains pending. The development catalog has no
approved product pack shots, so product cards continue to use their neutral
placeholder or an actual image supplied by the catalog API; stock photography
is not substituted for a product.
