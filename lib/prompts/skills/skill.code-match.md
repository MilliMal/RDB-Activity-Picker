# code-match.md
# Loaded by: /api/match-codes ONLY (alongside clarify.md)

Your task is to evaluate the filtered list of activity codes and
find the best matches for the user's business description.

The filtered list is injected into this prompt by the server.
It will contain between 10 and 500 codes depending on which
sections were matched. Each code has: code number, activity name,
section, sector, and division.

---

## Understand the business first (mandatory)

You must form a coherent picture of the **business as a whole**
before you pick any codes. Do not match by scanning for product or
service words and attaching one code per word.

In order:

1. **Operation type** — What does this business *do* day to day?
   (Retail to the public, wholesale, manufacturing, farming,
   transport, accommodation, etc.)

2. **Primary revenue / customer promise** — What is the main thing
   customers come for? What pays the bills?

3. **Structure** — Is this **one** operation (one shop, one stall,
   one company) or **clearly separate** lines of business (e.g. "I
   have a farm and a separate shop," "we manufacture and also run
   our own retail stores")? If the user only lists different
   products or activities without that structure, **do not assume**
   multiple independent businesses.

4. **Coherence** — If the description mixes unrelated goods or
   services (e.g. very different product categories with no link),
   treat that as ambiguous: prefer **clarify** (see clarify.md) over
   guessing multiple codes. A single retail outlet selling varied
   goods is **one** retail business — look for the best **single**
   code that describes that operation (e.g. non-specialised retail
   or mixed retail if the list offers it), not one narrow code per
   item.

5. **Industry coherence (registration framing)** — Companies register
   one primary economic story, not "digging and selling" as two labels.
   Match codes whose **section, sector, and division** belong to the
   user's **primary industry**: mining/quarrying vs retail trade vs
   agriculture vs manufacturing, etc. Someone who mines and sells their
   extracted minerals should get **mining/quarrying** codes, not retail,
   unless they are clearly traders who do not extract. Someone who farms
   and sells their own produce should get **agricultural production**
   codes, not wholesale/retail of purchased goods, unless they only buy
   and resell. Do not attach a trade code for every step in a vertical
   chain when one production/extraction code captures the business.

Only after this step should you map to specific codes. Your JSON
must include the businessUnderstanding field (required in the match
shape from the server prompt) so this synthesis is explicit.

---

## Primary category and ties

Decide the user's primary business category from the understanding
above. Ask: what category best explains the **whole** description?
Use that primary category to break ties. Do not let an incidental
keyword outrank the more coherent business category.

---

## Understanding the code structure

Codes are 5 digits. Example: 45201
  First 3 digits (452) = division within the section
  Last 2 digits (01)   = specific activity within that division

Activities in the same division (same first 3 digits) are closely
related. When in doubt between two codes with the same first 3
digits, prefer the more specific one.

---

## How to evaluate codes

Read the user's full description including any clarification
answers. Then evaluate codes by asking:

1. Which category best explains the business as a whole?
   Prefer codes whose section, sector, and division fit the primary
   category. If several described details all point to the same
   category, choose codes from that category before isolated keyword
   matches from another category.

2. Does the activity name match what this business DOES?
   Not what it sells — what it DOES as an operation **as its primary
   industry** (extract, manufacture, grow, transport, retail, etc.).

3. Is this a main activity or only an ancillary detail?
   Do not return a separate code for something sold or offered inside
   another business unless the user clearly describes it as its own
   revenue line or separate operation.

4. Is this the most specific code available?
   "Growing of Leafy or Stem Vegetables" beats "Growing of
   Other Vegetables" if the user mentioned leafy vegetables.

5. Does the division label confirm the match?
   A code under "Retail Trade" division should be for a
   business that sells to the public. If the user sells to
   other businesses, look under "Wholesale Trade" instead.

6. Are there multiple valid codes?
   Return one code per **distinct business activity or operation** the
   user clearly described — not one code per product noun.
   If they describe one shop or one market business selling several
   kinds of goods, that is usually **one** code unless the official
   list requires splitting (rare). If a single activity maps to one
   clear code, return only that. Do not pad with loosely related codes.

---

## Writing the reason string

The reason must be written in plain language that a non-expert
can understand. It should explain WHY this code fits — not just
restate the activity name.

Good reason:
  "You described selling tomatoes directly to customers at a
   market stall. This code covers exactly that — retail sale
   of fresh vegetables to the public."

Bad reason:
  "This code is for Retail Trade, Except of Motor Vehicles and
   Motorcycles, which matches your business."

The reason should reference something specific the user said.
One or two sentences maximum.

---

## Common Rwanda matching patterns

"I sell [product] at [market/shop]"
  → Retail trade in G (unless they make the product → C or A)

"I sell [product] in my hotel/restaurant/salon/school/clinic"
  → Usually treat the sale as ancillary to the service business.
    Return a retail code only if the user clearly describes a
    separate shop or says selling that product is a main activity.

"I transport people or goods by moto, car, or truck"
  → Land transport in H

"I run a restaurant, bar, hotel, or guesthouse"
  → Food service or accommodation in I

"I build or renovate houses or offices"
  → Construction in F

"I make or manufacture or produce [product]"
  → Manufacturing in C — find the specific sub-code

"I grow [crop] or I farm"
  → Agriculture in A — find the specific crop code

"I repair [item]"
  → Either S (personal goods: phones, clothes, furniture)
    or G (motor vehicles) — check the division

"I teach or I run a school or training centre"
  → Education in P

"I provide [professional] services"
  → Professional services in M

"I do hair or I run a salon"
  → Other service activities in S — code 960201 or nearby

"I am a tour guide" or "I guide tourists"
  → code 799004 (Tourist Guides / Visitor Assistance), NOT 791101
    791101 is for travel agencies that sell travel packages.
    791201 is for tour operators that assemble package tours.
    799004 is specifically for tourist guides.

"I run a hotel with tour guides / safari guests"
  → code 551001 or the most specific accommodation code for the hotel.
    Also return 799004 if they provide tourist guides as a service.
    Return 791201 only if they arrange or assemble safari/tour packages.
    Do not return clothing retail just because clothes are sold inside
    the hotel unless clothing retail is a separate shop or main business.

"I run a travel agency" or "I sell travel packages"
  → code 791101 (Travel Agency Activities)

"I organise tours" or "I run a tour operator"
  → code 791201 (Tour Operator Activities)

---

## Precision matters more than coverage

Return exactly the codes that match. If the user described 3
distinct activities, return 3 codes. If one activity has two
equally valid codes, return both. Never pad with approximate
matches, and never drop a valid match to keep the list short.

If the filtered list does not contain a clearly correct code,
this is the signal to ask a clarifying question (see clarify.md).
Do not manufacture a match from poor candidates.
