# clarify.md
# Loaded by: /api/match-codes ONLY (alongside code-match.md)

Use this skill when you cannot confidently match codes with the
information available. It tells you when to clarify, how to
frame the question, and how to write good options.

---

## When to clarify

Clarify when the filtered code list contains multiple plausible
matches that would require different codes depending on a fact
you do not know.

Ask yourself: "Does the answer to my question change which codes
I return?" If yes, clarify. If no, just match.

Clarify:
  ✓ You sell tomatoes — but do you grow them or buy them to resell?
    (Changes between A and G)
  ✓ You do transport — do you carry passengers or cargo?
    (Changes the specific H code)
  ✓ You run a cooperative — what does the cooperative produce or do?
    (Could be A, C, G, or many others)
  ✓ You repair things — what kind of things?
    (Changes between S, G, C)

Do not clarify:
  ✗ You want to double-check something you are already 90%+ confident about
  ✗ The question would only change which of two very similar codes
    you pick within the same division
  ✗ You already asked something similar in a previous clarification
    round (check clarifyHistory)
  ✗ The user gave enough detail — do not ask for more just to be thorough

---

## How to frame the question

The question should name the specific thing you need to know.
One sentence. Direct. Specific.

Good question (EN):
  "Just to make sure I get you right — do you grow the tomatoes
   yourself, or do you buy them and sell them on?"

Good question (FR):
  "Pour être sûr — est-ce que vous cultivez les tomates vous-même,
   ou vous les achetez pour les revendre?"

Bad question:
  "I need some clarification to find the best activity codes for
   your business. Could you tell me more about how your business
   operates in terms of the supply chain of your products?"

---

## How to write options

Options must be mutually exclusive. Each option is a complete,
plain-language description — not a code name, not a technical
term.

Good options for "I sell tomatoes":
  "I grow my own tomatoes and sell them directly"
  "I buy tomatoes wholesale and sell them at a market or shop"
  "I both grow and buy tomatoes to sell"

Bad options:
  "Agricultural production"
  "Retail trade"
  "Option A"

Number of options: 2 to 4 maximum. Do not pad — if there are
only 2 real cases, return 2.

---

## Checking clarifyHistory before you ask

Always check the clarifyHistory before writing a question.
If the user already answered something related, do not ask again.
Use that answer in your matching instead.

---

## Rwanda-specific clarification patterns

"I sell [agricultural product]"
  → Clarify: do they grow it (A) or trade it (G)?

"I do transport"
  → Clarify: passengers (taxi, moto, bus) or goods (trucking)?

"I have a boutique"
  → In Rwanda, boutique almost always means clothing or
    accessories retail. Do not clarify unless something
    suggests otherwise.

"I run a cooperative"
  → Clarify: what does the cooperative produce or do?
    Options: crop farming, livestock, manufacturing,
    retail trading, services, other

"I repair things"
  → Clarify: what do you repair?
    Options: vehicles and motorcycles, phones and electronics,
    clothes and shoes, household appliances, other

"I do events"
  → Clarify: what kind?
    Options: catering and food service, event planning and
    coordination, audio/visual and technical services, other

"I do cleaning"
  → Usually N (cleaning services to businesses or buildings).
    Clarify only if it could be household laundry (S).
