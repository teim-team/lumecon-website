# Sector image license manifest

Every photograph that enters the duotone pipeline gets a row here
before its processed webp is committed. The processed files in
public/naics/ are derivatives of these sources; this manifest is the
record that each one is properly licensed.

## License status

All 21 source photographs are licensed to Lumecon Inc. under the
Shutterstock **Standard license**, confirmed against the Shutterstock
account License history (Images tab) on 2026-07-26. Each download in
that history is dated 2026-07-25 and the license/download IDs below
match it one to one. The Standard license is perpetual: it remains
valid after the subscription ends, so keep the license certificates
with the account records.

What the Standard license permits, in plain terms: use in and around
the product, including web and app interfaces, marketing and
documentation, with generous reproduction limits well beyond
Lumecon's use. It does not permit resale of the image itself, use in
a way that suggests the depicted people endorse Lumecon, or
redistribution of the original file. Our architecture already
respects this: Lumecon assigns a duotone-processed image to a sector
or analysis, and no endpoint exposes or lets a customer download the
original photograph.

## Rules of use

- Images are assigned by Lumecon to an analysis or sector
  presentation. Customers never browse, search or extract the
  underlying imagery, and no endpoint exposes originals.
- The Standard license here is per-image and perpetual. If a future
  image comes from an Unlimited subscription instead, it is licensed
  per download; before reusing one such image across many customer
  analyses, confirm the licensing structure with Shutterstock and
  note the confirmation in its row.
- Third-party photographs from partner materials (for example the
  CICD and NACA member photographs in the NACA proposal) are not
  licensed to Lumecon and never enter this pipeline.

Originals live in scripts/naics/sources/. Filenames are
`<sector-slug>_shutterstock_<imageID>_<downloadID>.jpeg`, so sources
sort by sector while carrying both Shutterstock IDs. The imageID
(the middle number) is the Shutterstock asset ID shown in License
history; the downloadID (the trailing number) is that download's
license ID.

## Manifest

Grouped by the brand wash each sector is assigned (teal, green,
bronze, gold), then alphabetical within the group. Every row:
Standard license, licensed to Lumecon Inc., download dated
2026-07-25, verified 2026-07-26.

### Teal wash

| Sector slug | Shutterstock asset ID | License ID | Subject |
| ----------- | --------------------- | ---------- | ------- |
| construction | 2650575753 | 806729367383 | Rebar crew on a structural deck |
| healthcare | 2740247283 | 806730895076 | Clinician with a patient |
| manufacturing | 2761678059 | 806729672016 | Plant floor with crew |
| transportation | 2755727965 | 806729746252 | Cargo ships at sea |
| tribalgov | 2687071147 | 806731176783 | Feather regalia with beadwork |

### Green wash

| Sector slug | Shutterstock asset ID | License ID | Subject |
| ----------- | --------------------- | ---------- | ------- |
| administrative | 2649430167 | 806730812954 | Residential waste collection |
| agriculture | 2742674003 | 806728869271 | Center-pivot irrigation |
| finance | 2757439509 | 806730469490 | Teller counting out cash |
| information | 2755968559 | 806730352156 | Data center aisle |
| publicadmin | 2762229605 | 806731103459 | US Capitol dome |

### Bronze wash

| Sector slug | Shutterstock asset ID | License ID | Subject |
| ----------- | --------------------- | ---------- | ------- |
| hospitality | 2791267727 | 806731004894 | Hotel guest room |
| management | 2760794513 | 806730652571 | Corporate handshake |
| mining | 2721227155 | 806729202969 | Open-pit mine, aerial |
| realestate | 2753397735 | 806730589724 | Mid-rise apartment blocks |
| wholesale | 2756043513 | 806730308942 | Distribution docks, aerial |

### Gold wash

| Sector slug | Shutterstock asset ID | License ID | Subject |
| ----------- | --------------------- | ---------- | ------- |
| arts | 2677283257 | 806730967478 | Roulette wheel, gaming |
| education | 2722208973 | 806730862618 | Instructor before a seated audience |
| otherservices | 2699860863 | 806731060268 | Joined hands, community organization |
| professional | 2752039147 | 806730706435 | Consulting team meeting |
| retail | 2769581455 | 806730275771 | Grocery shopper with a basket |
| utilities | 2750775877 | 806729298773 | Transmission towers at dusk |

All 21 tiles (20 NAICS sectors plus the Tribal Government category)
carry licensed photography.
