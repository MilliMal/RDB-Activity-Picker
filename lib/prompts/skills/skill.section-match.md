# section-match.md
# Loaded by: /api/match-sections ONLY

Your task is to identify which sections of the activity code list
are most likely to contain the user's business activity. Return
between 1 and 3 section letters. Return the minimum needed —
do not return sections just to be safe.

First form a **single mental summary** of what kind of business this
is (how it operates and earns money). Do **not** choose sections by
matching each product or keyword independently — anchor on the whole
operation. Then identify the primary business category: what the
business is mainly operated as, how customers experience it, and
where its main revenue is likely to come from. Use that category as
the anchor for section selection. Only add another section when the user
clearly describes a **separate** line of business, not just a facility,
customer type, location, product sold on the side, or supporting
service inside the main business.

---

## Registration framing and industry coherence

RDB registration asks for a **primary economic activity** — one coherent
industry story, not a list of every verb in the value chain.

- **Anchor on the industry the user is really in.** A mining or quarrying
  business extracts minerals, stone, or sand; it will sell what it
  extracts — that selling is part of the **same** extraction business,
  not a separate "retail" business. Prefer **B** for that operation.
  Do **not** add G (trade) just because they sell the product: include G
  only if wholesale or retail of goods is clearly a **distinct** main
  line (e.g. they mainly trade minerals they did not extract).

- **Retail** businesses buy and sell goods as their core — anchor on **G**
  when that is what they do. Do not drift them into mining or agriculture
  because of what they sell.

- **Farming** (growing, raising, harvesting) naturally includes selling
  the harvest. Anchor on **A** when they produce the goods. Do **not**
  add G only because they sell tomatoes or milk at market — that is still
  the farming operation unless they are clearly **only** traders who buy
  in and resell (then G, not A).

- **One coherent section set:** returning both B and G for "we mine and
  sell the minerals" usually wrong-frames the business unless they
  described **two** distinct operations (e.g. a quarry **and** a separate
  shop that only resells others' products). Same idea for A vs G:
  prefer **one** primary section when the description is a single
  vertical chain; use two sections when the user describes genuinely
  separate businesses or when grow-vs-trade is **unclear** (then A and G
  as documented below).

---

## Section guide

### A — Agriculture, Forestry and Fishing (114 codes)
Businesses that grow, raise, catch, or harvest from nature.
Includes: crop farming, animal rearing, fishing, aquaculture,
forestry and logging.
Rwanda signals: growing coffee, tea, pyrethrum, vegetables,
fruits; raising goats, cows, chickens; fishing on Lake Kivu.
Do NOT include A if they are clearly only selling produce they
bought elsewhere — that is G (trade).
If it is unclear whether the user grows or trades an agricultural
product, include BOTH A and G — the code-matching step will
resolve the ambiguity through clarification.

### B — Mining and Quarrying (14 codes)
Extraction of minerals, stone, sand, clay from the ground.
Rwanda signals: quarrying stone for construction, extracting
coltan, cassiterite, wolframite, sand mining.
Rare — most small businesses will not be in B.

### C — Manufacturing (1,062 codes)
CRITICAL: This is the largest section with over 1,000 codes.
Only include C if the user is physically making, processing,
or transforming materials into a different product.
Key distinction: buying and reselling is G. Making is C.

Rwanda signals: processing food products, sewing or making
clothes, carpentry and furniture, metal fabrication, printing,
soap making, juice production, brick making, bottling water.

Sub-divisions in C:
- Food products (processing, not growing)
- Textiles and wearing apparel
- Leather products
- Wood products and furniture
- Printing
- Chemicals, soap, cosmetics
- Rubber and plastics
- Metal products
- Electronics and electrical equipment
- Machinery

### D — Electricity, Gas, Steam Supply (16 codes)
Businesses that generate or distribute electricity or gas.
Rare for private registration — mostly utilities.

### E — Water Supply and Waste (41 codes)
Water treatment, sewerage, waste collection, recycling.
Rwanda signals: waste collection companies, plastic recycling,
water supply to buildings.

### F — Construction (49 codes)
Building, civil engineering, and specialised construction.
Rwanda signals: building houses, offices, or roads; plumbing;
electrical installation; painting buildings; landscaping.
Key distinction: designing buildings is M. Building them is F.

### G — Wholesale and Retail Trade (197 codes)
Buying and selling goods — wholesale or retail.
Also includes vehicle sales and repair.

Most common section for Rwandan small businesses.
Rwanda signals: boutique, selling clothes, food, electronics,
furniture, medicine; market trader; import/export of goods;
car dealership; motorcycle sales.

Key distinction: if they MAKE what they sell → C or A.
If they BUY and RESELL → G.
Do not include G just because a hotel, restaurant, tour company,
school, clinic, salon, or other service business sells a small item
to its own customers. Include G only when trade is a clear separate
business activity or the main activity.

Sub-divisions in G:
- Motor vehicle trade and repair
- Wholesale (selling in bulk to businesses)
- Retail (selling directly to public)

### H — Transportation and Storage (56 codes)
Moving people or goods by any means, plus warehousing.
Rwanda signals: moto taxi, taxi, car hire, bus service,
trucking, cargo transport, courier delivery, warehousing.
Note: moto taxi is specifically in H — Land Transport.

### I — Accommodation and Food Service (40 codes)
Hotels, guesthouses, restaurants, bars, catering.
Rwanda signals: hotel, restaurant, bar, café, catering for
events, food delivery service.
Key distinction: manufacturing food to sell in shops is C.
Cooking food for people to eat or delivering ready meals is I.
If the user says they have a hotel, lodge, guesthouse, or resort,
I is usually the anchor section even if they mention tourists,
safaris, guides, meals, or small goods sold to hotel guests.

### J — Information and Communication (66 codes)
Technology, media, publishing, telecoms, software.
Rwanda signals: software development, app building, website
design, IT services, internet café, call centre, TV or radio
production, photography studio, video production.

### K — Financial and Insurance Activities (42 codes)
Banking, insurance, investment, mobile money, microfinance.
Rwanda signals: SACCO, MFI, forex bureau, insurance agent,
mobile money agent, investment fund, money lending.
Note: mobile money agents map to K, not G.

### L — Real Estate Activities (10 codes)
Buying, selling, renting, or managing property.
Rwanda signals: real estate agency, property management,
renting out houses or commercial space, land transactions.
Key distinction: building property is F. Dealing in it is L.

### M — Professional, Scientific and Technical (59 codes)
Expert knowledge services — consulting, legal, accounting,
engineering, research, advertising, veterinary.
Rwanda signals: lawyer, accountant, engineering consultant,
research organisation, advertising agency, management
consulting, audit firm, vet clinic.
Key distinction: doctors and dentists are Q, not M.

### N — Administrative and Support Services (84 codes)
Business support that is not professional expertise.
Rwanda signals: security company, cleaning services,
travel agency, car rental, temp staffing, document
preparation, parking services.
Key distinction: travel agency is N. Hotel is I.
Tour operators, travel agencies, reservation services, and tourist
guides are in N. If a hotel also provides guided tours or safari
arrangements as a real service, include both I and N.

### O — Public Administration and Defence (36 codes)
Government activities only.
Do not include for any private business registration.

### P — Education (49 codes)
Any form of teaching or training.
Rwanda signals: school, university, vocational training,
language school, driving school, computer training, tutoring,
early childhood development centre.

### Q — Human Health and Social Work (26 codes)
Medical, dental, nursing, social welfare services.
Rwanda signals: clinic, hospital, dentist, physiotherapy,
counselling, orphanage, home care services.
Note: a pharmacy dispensing prescriptions is Q.
A shop selling over-the-counter medicine is G (retail).

### R — Arts, Entertainment and Recreation (40 codes)
Sports, culture, arts, gambling, amusement.
Rwanda signals: sports club, gym, cinema, museum, cultural
performance, gambling, recreational facility, dance school.

### S — Other Service Activities (69 codes)
Personal services and membership organisations.
Rwanda signals: hair salon, barber, laundry, dry cleaning,
tailoring repair, shoe repair, repair of household goods,
religious organisations, trade associations, NGOs.
Key distinction: making new clothes is C. Repairing them is S.

### T — Household Activities (3 codes)
Domestic workers employed directly by households.
Almost never relevant for standard business registration.

### U — Extraterritorial Organizations (2 codes)
UN, embassies, international bodies.
Not relevant for private business registration.

---

## Decision rules

1. Prefer the **minimum** number of sections that still reflects the
   user's primary industry(ies). One section is normal for a single
   coherent business. Add a second or third only for a **distinct**
   additional line of business, or for documented ambiguity (e.g. A+G
   when grow vs trade is unclear).
2. If the business has two **truly separate** activities (e.g. they
   clearly run both a factory and unrelated retail shops), return both
   relevant sections. Do **not** treat "make then sell" or "mine then
   sell" or "farm then sell" as two activities — that is one chain.
3. Do not split a description into unrelated sections for activities
   that are only ancillary to the primary category. Example: a hotel
   that sells clothes or souvenirs to guests is still primarily I
   unless the user clearly says retail is a separate shop/business.
4. When the input mentions selling an agricultural product (crops,
   vegetables, fruit, livestock products, fish) and it is not
   clear whether the user grows/raises it or buys it to resell,
   return BOTH A and G. Do not guess — the next step will clarify.
5. Never return O, T, or U for a private business.
6. Section C has 1,062 codes. Only include it when the user is
   clearly making or transforming something physical.
