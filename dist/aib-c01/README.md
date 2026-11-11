# AIB-C01 practice

Unofficial practice for the **AWS Certified AI Business Strategist (AIB-C01)** exam. A duskyAI side project. Live URL: [https://www.duskyai.com/aib-c01/](https://www.duskyai.com/aib-c01/).

Not an AWS product, not the official practice question set, and not endorsed by AWS or by the question author.

## What it is for

People preparing for AIB-C01 can:

- Work scenario questions by domain, in one full set, or from a saved-miss list
- See first-try accuracy and which domain is weakest
- Sit a timed mock (130 minutes at exam-guide pace, or 170 minutes at beta pace)

The exam tests business judgment: whether to use AI, how to measure value, how to govern it, and how to scale it. It does not test coding or hands-on AWS implementation.

Public exam facts (from the AWS exam guide and certification page, not from this app): 85 multiple-choice and multiple-response questions, 130 minutes in the exam guide and 170 minutes in the beta overview, scaled score 100–1,000, pass at 700, unanswered items scored wrong. Domain weights: Fundamentals 24%, Strategy and Business Value Creation 28%, Governance and Responsible AI Leadership 24%, Business Readiness, Leadership, and AI Transformation 24%.

## Who it is for

Business people who evaluate, champion, or scale AI: product and program managers, consultants, analysts, sales, marketers, line-of-business leads. A technical background is not required.

## Where the content comes from

| Piece | Source |
| --- | --- |
| Questions and rationales | Adapted from [Matthew Purcell’s unofficial AIB-C01 practice set](https://www.linkedin.com/posts/purcellmatthew_aws-ai-business-strategist-aib-c01-practice-activity-7514059578137927680-w-jP), [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Stored in `questions.js`. Keep the footer attribution. Non-commercial use only. |
| Exam facts on the landing page | Public AWS pages, each with a short description on the page: [exam guide](https://docs.aws.amazon.com/aws-certification/latest/ai-business-strategist-01/ai-business-strategist-01.html) (domains, timing, pass mark), [schedule the exam](https://aws.amazon.com/certification/certified-ai-business-strategist/) (credential overview), and the [Skill Builder exam prep plan, English](https://skillbuilder.aws/learning-plan/B8J6KKJ45C/exam-prep-plan--aws-certified-ai-business-strategist-aibc01--english/) (official training, not this practice set). |
| App, scoring, landing copy | This repo (duskyAI). Progress stays in the browser (`localStorage`). |

Do not publish the question bank as separate public pages. The interactive set stays in `questions.js`.

`tests/` is for local checks. `1791415052344.pdf` is a reference file and is not served by the page.

## Deploy

Static files. `npm run build` copies this folder to `dist/aib-c01/` and skips `tests/` and `1791415052344.pdf`. Relative paths to `css/`, `js/`, and `questions.js` stay inside the folder. The logo and favicon are the site-root files under `/assets/`.

Serve it at `https://www.duskyai.com/aib-c01/` only. The homepage project card uses the anchor **AIB-C01 practice exam**, and that URL is in the host-root sitemap. Submit the sitemap in Search Console after deploy. Do not add a second URL for the same app.

## SEO

One URL: `https://www.duskyai.com/aib-c01/`. The title and H1 carry the long name. The path stays the exam code.

**Primary terms** (title, H1, first paragraph):

- AIB-C01
- AIB-C01 practice exam
- AIB-C01 practice test
- AWS Certified AI Business Strategist

**Supporting terms** (body, FAQ — once each, in a real sentence):

- AIB-C01 exam
- AIB-C01 exam test

**Search variants** (one sentence only; do not put them in the title as if they were the official name):

- Amazon AI certificate
- Amazon Certified AI Business Strategist

There is no separate Amazon credential. The name is AWS Certified AI Business Strategist (AIB-C01).

**Do not target** as if this site were the source of truth: “official AIB-C01 practice test”, “AWS exam dump”, “real exam questions”. The page should keep saying the set is unofficial.

Visible copy that should stay in the HTML (not only in JavaScript): what the exam is, timing and the 700 pass line, the four domains, and the FAQ. The FAQ text and the `FAQPage` JSON-LD in `index.html` must match.

## GEO

GEO here means generative-engine optimization: being quoted correctly by answer engines (Google AI Overviews, Perplexity, ChatGPT search, and similar), not a country or city.

Those systems prefer a single page that states facts in plain sentences and points at a primary source. For this site:

- Keep the FAQ answers short and literal. They are the lines a model is most likely to repeat.
- Name the credential in full on first mention: AWS Certified AI Business Strategist (AIB-C01).
- Attribute exam length, question count, and the pass mark to the AWS exam guide, and link that guide. Do not let the app sound like it defines the exam.
- State in the same breath that this practice set is unofficial and not endorsed by AWS, so a summary does not call it the official Amazon or AWS test.
- Mention “Amazon AI certificate” only as a search alias for the AWS credential, so models do not invent a second certificate.
- Do not add city or country pages. The exam is global (English and Japanese); there is no local landing page to rank.

Same terms as SEO. GEO does not need a second keyword list. It needs the same facts, written so they can be lifted without the interactive app.
