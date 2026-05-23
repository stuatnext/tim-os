# Tim OS — Opportunity Radar

**Read this on every run.** This is the comprehensive map of where Tim's opportunities come from. The standard is: *Tim should be THE vertical media mogul*. That means the radar has to be wide, deep, and disciplined — not just "what's in the RSS feed today".

A run that only surfaces three Variety articles is a failed run.

## The frame: Hollywood for mobile phones

Vertical drama / microdrama is **Hollywood for mobile phones**. This space is built on **appearances** as much as substance. The Hollywood mogul template is the reference, not the SaaS-CMO template.

What that means for Tim OS:

- **Tim should be SEEN, not just READ.** A LinkedIn paragraph is the floor, not the ceiling. Pieces-to-camera, vlogs from MIP / APOS / LA / NEM Dubrovnik, behind-the-scenes from FlareFlow shoots, reaction takes on competitor content — all matter more than a 400-word think-piece.
- **Recognisability is a goal in itself.** Tim should be the face people associate with global vertical drama. That requires repeated visual presence: same person, same voice, same physical settings (studio, set, conference green room) — a visual identity, not just a verbal one.
- **Daily presence beats weekly thought leadership.** Mobile-first audiences expect cadence. One sharp 30-second piece-to-camera per day beats one 800-word LinkedIn post per week — and *also* gets reshared by the trade press.
- **Performance is part of the job.** Charisma, energy, vibe, taste. The CMOs of Disney, Netflix, A24, Warner are visible humans with point of view. Tim should be that for vertical.
- **Appearances aren't shallow when the category is appearance.** Microdrama IS performance. A leader who only writes is a leader the industry can't picture. Make sure Tim is picture-able.

When in doubt: **does this surface make Tim more visible, more recognisable, more performance-forward?** If yes, push it. If no, deprioritise.

---

## Environment network policy (read first if `npm run feeds` returns no items)

The deterministic feed fetch (`src/lib/feeds.ts`) tries to hit ~26 RSS endpoints — direct trade-press feeds (Variety / Deadline / THR / Bloomberg / ContentAsia / TBI / C21 / The Drum / Mumbrella Asia / Campaign Asia / TechCrunch / Reuters / Mashable) and Google News search-RSS fallbacks. The routine's runtime environment needs outbound access to those hostnames.

**Signal:** if `npm run feeds` returns `networkPolicyBlocked: true` or every source line is tagged `[denied]`, the environment's egress allowlist is blocking the RSS hosts. The fix is not in the code — the routine environment's network policy must be updated in Claude Code on the web. The harness docs cover this at https://code.claude.com/docs/en/claude-code-on-the-web.

**Hostnames the policy should permit (outbound HTTPS):**

```
variety.com
deadline.com
hollywoodreporter.com
techcrunch.com
campaignasia.com
feeds.bloomberg.com
reutersagency.com
feeds.mashable.com
contentasia.tv
tbivision.com
c21media.net
thedrum.com
mumbrella.asia
news.google.com
```

If the policy can't be widened, the routine should still produce value from the existing state (awards / speaking / media / contacts / press / settings) — log the run as `low-value` with `lowValueReason` naming the network gap, and surface the missed sweep in the brief's `whatChanged`.

---

## What "comprehensive" means per run

Each routine run should sweep across **all** the categories below — not just news. Each category is a different way for Tim to win.

| # | Category | What it produces |
|---|---|---|
| 1 | Microdrama / vertical industry signals | Trend posts, market POV, contrarian takes |
| 2 | Competitor movement | Comment / DM opportunities, positioning angles |
| 3 | Streamer / studio / platform shifts | Pitch, comment, "watch" signals on Netflix, YouTube, TikTok, Disney, Spotify, etc. |
| 4 | Adjacent commerce + creator economy | Crossover angles — live shopping, creator funds, social commerce |
| 5 | Asia-to-global content flow | The Korean Wave, China IP exports, India OTT — Tim's signature bridge story |
| 6 | Brand / advertiser entry into vertical | "Brands are coming" proof points; CPG, beauty, gaming, retail |
| 7 | AI in content production | Sora, Veo, Runway, Luma, AI dubbing, AI casting — Tim's "execution layer" thesis |
| 8 | Investor / equity / IPO / M&A signals | COL stock, competitor cap raises, public-market narratives |
| 9 | Regulatory + platform-policy signals | App store moves, China content rules, content moderation |
| 10 | Awards calendar | Open submissions Tim should enter |
| 11 | Conferences + panels | Open CFPs, panels Tim should be on, events to attend |
| 12 | Podcasts | Shows that fit Tim; named hosts to pitch |
| 13 | Journalists actively on the beat | Named bylines; their last 30-day output; pitch angles |
| 14 | LinkedIn voices to engage | Specific executives / investors / analysts Tim should comment on or DM |
| 15 | People Tim should publicly support | Posts to repost / amplify with a sharp one-liner |
| 16 | People Tim should privately message | DMs to send (relationship build, not sales) |
| 17 | Tim's own narrative arcs | Wikipedia readiness, speaker bureau readiness, profile pieces |
| 18 | COL positioning opportunities | Trade announcements, deal narrative, B2B signal |
| 19 | Reputation watch | Things being said about Tim, COL, ReelShort, FlareFlow that need defending or correcting |
| 20 | "What to ignore" | Genre noise. The discipline of saying no. |
| 21 | **Visual / on-camera content** | Piece-to-camera scripts, travel vlogs (LA, MIP, APOS, NEM), behind-the-scenes from FlareFlow shoots, reaction videos to competitor / Hollywood content, photo opps. **At least one per week.** |
| 22 | **Critical mentions + contrarian framings** | People dunking on microdrama as "Hollywood's death" / "TikTok slop" / "Chinese soft power" — pieces Tim can publicly engage with rather than ignore. Co-opt the criticism. |
| 23 | **Out-of-the-box plays** | Unconventional moves: collabs with non-microdrama creators (gaming, comedy, cooking, music), IRL pop-ups, brand activations, live screenings, vertical-drama-meets-X mashups. The "what would a real mogul do" surface. |
| 24 | **Partner discovery** (beyond known) | New entrants worth a DM — indie production houses entering vertical, agency CMOs commissioning vertical pilots, talent agents repping vertical-native creators, app launches in adjacent spaces, regional studios in markets where COL is light. |

If a run produces nothing in a category that should have produced something, the run is incomplete.

---

## Where to look (the source map)

This is the **master source map** — every place Tim's signals can come from. It is split by fetch mechanism, because not every source publishes RSS:

- **[RSS]** sources are auto-pulled by `npm run feeds` (listed in `src/lib/data/feed-sources.ts`). Claude Code triages the resulting items in-session.
- **[Web]** sources have no usable RSS (paywalled, dead, social-only, app-store-only). Claude Code must fetch these via web search / web fetch during the in-session run. **The routine should still check them every weekly run** — they're often where the most interesting signals live.

**Rule:** if an RSS endpoint has 403'd or errored consistently across several runs, write it out — remove it from `feed-sources.ts` and re-list it here as `[Web]`. Don't keep running a routine that throws an error every fire.

### Trade press

| Source | How to fetch | Notes |
|---|---|---|
| Variety (international, streaming, digital verticals) | **[RSS]** | Tim's primary trade. Multiple exclusives so far. |
| Deadline (international) | **[RSS]** | Existing relationship. |
| The Hollywood Reporter (business) | **[RSS]** | MIP London coverage already filed. |
| Campaign Asia | **[RSS]** | Key APAC marketing relationship. |
| ContentAsia | **[RSS]** | Janine Stein — broke the CMO appointment. Most consistent amplifier. |
| TBI Vision | **[RSS]** | International TV business. |
| C21Media | **[RSS]** | International TV business. |
| The Drum | **[RSS]** | Global marketing trade. |
| Mumbrella Asia | **[RSS]** | APAC media + marketing. |
| TechCrunch (esp. apps) | **[RSS]** | Consumer tech + entertainment apps. |
| Bloomberg — Technology & Media | **[Web]** — *public RSS deprecated 2019* | Search via Google News query or Bloomberg site search. Lucas Shaw's *Screentime* newsletter is the priority byline. |
| Reuters — Tech & Media | **[Web]** — *agency RSS retired* | Search reuters.com directly or via Google News. |
| The Information | **[Web]** — *paywalled* | Search headlines via Google for `"The Information" + microdrama / TikTok / streaming`. Kaya Yurieff + Sahil Patel are the names. |
| TVBIZZ (tvbizz.net) | **[Web]** — *no usable RSS* | Tim's most-quoted outlet. Manual fetch — Yako Molhov byline. |
| Adweek (CTV / Streaming) | **[Web]** | Mark Stenberg byline. Manual fetch. |
| Mashable Entertainment | **[Web]** — *FeedBurner URL long-defunct* | Low priority for Tim's beat; can skip in most runs. |
| Stratechery (Ben Thompson) | **[Web]** | Paid newsletter; check via stratechery.com or social mentions. |
| Vitrina AI | **[Web]** | Tim has been quoted. Manual fetch via vitrina.ai. |
| Sensor Tower / data.ai blog | **[Web]** | App rankings + install / revenue data; check via their public charts. |

### Microdrama-specific outlets

- **Drama Box / ReelShort / FlareFlow / ShortMax / GoodShort / DramaWave / NetShort / PineDrama** — press rooms, blog, social.
- **WeChat / Weibo via translation** — search "短剧 出海" (microdrama going global), competitor names in Chinese. **Do this every run** — half the global vertical-drama conversation happens here.
- **Sensor Tower microdrama app rankings** — published quarterly.

### Independent newsletters + Substacks (paid + free)

These ship faster than trade press and break stories the trades pick up later. **[Web]** for all.

- **Puck** (Matthew Belloni's *The Town* + Dylan Byers + Eriq Gardner) — Hollywood insider business.
- **Stratechery** (Ben Thompson) — strategy framing pieces; quote him in Tim's content.
- **Matthew Ball** (mattball.substack.com) — metaverse / consumer-tech long reads; cites vertical occasionally.
- **Hamilton Nolan** — labour / media commentary; useful for critical takes.
- **Screentime** (Lucas Shaw, Bloomberg) — weekly Hollywood + streaming newsletter; Tim's most-likely Bloomberg byline.
- **Marketing Brew + Morning Brew Daily** — brand-side coverage of where ad dollars go.
- **The Hustle**, **Trapital** (Dan Runcie — music + culture business), **Big Technology** (Alex Kantrowitz) — adjacent business.
- **The Information** — Kaya Yurieff / Sahil Patel on apps + creator economy.

### YouTube + creator commentary

People analysing the space on camera. Look for moments where Tim could appear as a guest, or where their take is a stitch-able reaction surface.

- **Cleo Abram** — explainer journalism; tech / media adjacent.
- **MKBHD / Marques Brownlee** — devices but increasingly media commentary.
- **Colin & Samir** — creator economy; already on Tim's pitch list.
- **Modern MBA** — long-form business analysis (microdrama deserves an episode).
- **Asianometry** — semis + Asia industry; cited in *Stratechery*.
- **The Town's video clips** (Puck's YouTube) — short, shareable.

### Reddit communities + qualitative audience

For unfiltered audience perception (and critical mentions).

- **r/microdrama** — small but active; the actual audience.
- **r/television**, **r/cordcutters**, **r/streaming** — Hollywood-side discourse where microdrama gets dunked on / praised.
- **r/marketing** — brand-side reactions to vertical campaigns.
- **r/ChineseStreamingService**, **r/cdrama** — bridge to the Chinese-content fanbase Tim's titles serve.
- **TikTok / Instagram search** for "ReelShort", "FlareFlow", "DramaBox" — what audiences are saying in their own voices, not trade press.

### App store + chart intelligence

The realest signal in mobile-first content. **[Web]** all.

- **Apple App Store — Top Grossing Entertainment** chart positions for ReelShort, DramaBox, ShortMax, GoodShort weekly.
- **Google Play — Top Grossing Entertainment** same.
- **Sensor Tower public reports** — quarterly mobile-app revenue.
- **data.ai** (formerly App Annie) — top apps + revenue trends.
- **App Store reviews** — sample 20 recent reviews of ReelShort + DramaBox each run; surface any pattern that's a content angle (e.g. "too many ads" → Tim's "we built monetisation that respects users" post).

### Academic + industry research

- **Omdia** (Maria Rua Aguete) — Tim's primary data anchor; check for new sizings.
- **Ampere Analysis**, **Parrot Analytics**, **MIDiA Research** — quarterly content / streaming reports.
- **S&P Global Market Intelligence** — public-company filings, M&A.
- **Nielsen / Comscore** — incidental mentions when they cover short-form.
- **PwC + Deloitte media outlooks** (annual) — for keynote-ready stats.

### VC + investor blogs

- **a16z** (Andreessen Horowitz blog) — Connie Chan (consumer/China) is Tim's specific target.
- **Sequoia Capital India**, **Lightspeed APAC**, **Khosla Ventures** — esp. their China + creator-economy theses.
- **TechCrunch fundraise tracker**, **Crunchbase News** — competitor cap raises.
- **Public-comp tracker** (S&P 300364 / Crazy Maple ticker) — COL stock + competitor public valuations.

### Brand industry trades (separate from entertainment trades)

Brand CMOs read different publications than Hollywood execs. Cover both.

- **AdAge**, **Adweek**, **Marketing Brew**, **AdExchanger**, **The Drum**, **WARC**.
- **Cannes Lions winners archive** (last 3 years) — vertical-drama angles for the brand-creative jury.
- **Campaign Asia**, **Mumbrella Asia**, **Marketing-Interactive SG** — APAC brand-side.
- **Effie Awards** + **Cannes Lions Effectiveness** — for the ROI-on-vertical case study Tim can build.

### Platform / streamer signals

- **TikTok** — product announcements, ad pricing, creator fund changes, mini-drama integration.
- **YouTube Shorts** — monetisation updates, ad load changes, Shorts-to-long pipeline.
- **Instagram Reels** — incentive programmes.
- **Snapchat** — Discover / Spotlight drama partnerships.
- **Netflix, Disney+, Max, Paramount+, Peacock** — short-form experiments, mobile-first slate, vertical orders.
- **Spotify Video** — video podcast plays as a vertical-adjacent surface.
- **Apple App Store + Google Play** — Top Grossing Entertainment chart positions for ReelShort, DramaBox, ShortMax weekly.

### Asia-to-global content flow

- **Korean Wave continuation** — Squid Game 2 effects, Netflix Korea slate.
- **China content export** — iQiyi, Tencent Video, Mango TV, YouKu — international titles.
- **India OTT** — JioCinema, Disney+ Hotstar merger fallout, ZEE5 mobile strategy.
- **Japan** — Toei + microdrama, anime mobile strategy.
- **MENA / Saudi** — Shahid, MBC, microdrama localisation potential.

### Brand + advertiser signals

Already-confirmed brand entrants: **P&G, Unilever, Crocs, Shopee**. Watch for: L'Oréal, Estée Lauder, Coca-Cola, Pepsi, Mondelez, Mars, Nestlé, Samsung, LG, McDonald's, Lazada, Sephora, Uniqlo, Shein, Temu, KFC, Starbucks. Any CPG/beauty CMO mentioning short-form / mobile-first / vertical-first = pitch / comment opportunity.

### AI in content production

- **Runway, Pika, Luma Dream Machine, Sora (OpenAI), Veo (Google), Kling (Kuaishou), Hailuo (MiniMax)** — new releases, pricing, capability.
- **ElevenLabs, HeyGen, D-ID** — AI dubbing / avatar.
- **Wonder Studio** — animation pipeline.
- *Tim's frame: "AI is the execution layer, not the industry."*

### Investor / equity / M&A

- **COL Group (SZSE: 300364)** — Shenzhen filings, analyst notes.
- **Crazy Maple Studio** (ReelShort parent in China — Bekkr Tech / COL — confirm relationship before quoting).
- **DramaBox parent** — fundraising rounds.
- **Streaming M&A** — Paramount, Warner, NBCU consolidation.
- Look at **Mary Meeker / Stratechery / Matthew Ball** annual reports for vertical-content data.

### Awards (rolling submission calendar)

Track each of these with: deadline, fee, fit score, status. Pull live deadlines on each run.

- **Cannes Lions** (Entertainment + Brand Experience categories) — Apr–May submission, Jun ceremony.
- **40 Under 40** — *AdAge*, *Fortune*, *Campaign Asia*, *Marketing Magazine SG*, *Variety Innovate*.
- **PromaxBDA Awards** — Tim has 2× wins; defend the relationship.
- **Adweek Most Powerful / Brand Genius / Creative 100**.
- **Campaign Asia Agency / Marketer / Tech of the Year**.
- **The Drum Awards APAC**.
- **MMA Smarties APAC**.
- **Mob-Ex Awards**.
- **Marketing Magazine SG Marketing Excellence Awards**.
- **WIRED Smart List** (longshot but high-value).
- **The Information's 50 Most Important People in Tech**.
- **Fast Company Most Innovative Companies / Most Creative People**.
- **PRWeek Power Book**.
- **CES Innovation Awards** (FlareFlow infrastructure angle).

### Conferences + panels (CFP + attend list)

Asia-Pacific:

- **All That Matters** (Singapore, Sep) — Tim should be on a panel.
- **APOS** (Bali, Apr) — Asia content business; APOS Awards.
- **ATF (Asia TV Forum)** (Singapore, Dec) — pitch + attend.
- **Spikes Asia** (Singapore, Feb-Mar).
- **MMA Impact APAC** (Singapore, May).
- **Marketing Pulse / SG Marketing Week**.
- **DPI / Digital Pacific Initiative**.

Global:

- **MIPCOM** (Cannes, Oct) + **MIPCOM Junior**.
- **MIP London** (Feb) — Tim already covered here.
- **NATPE Budapest** + **NATPE Miami**.
- **Cannes Lions** (Jun) — speaker + delegate.
- **Banff World Media Festival** (Jun).
- **SXSW** (Mar, Austin) — Featured Session / Mentor Sessions submission.
- **VidCon** (Anaheim, Jun) — creator economy.
- **The Town** (Aspen, Sep) — Hollywood deal-makers; Tim's stretch goal.
- **Web Summit** (Lisbon, Nov).
- **Collision** (Toronto, Jun).
- **C2 Montréal**.
- **Series Mania** (Lille, Mar).
- **Realscreen Summit** (Jan).

US-specific:

- **NewFronts** (May, NY).
- **Upfronts** (May, NY).
- **AdWeek NY**.

### Podcasts — Tim's named pitch list

**Tier 1 stretch:**

- *The Town* (Matthew Belloni, Puck) — Hollywood deals.
- *Pivot* (Kara Swisher + Scott Galloway) — tech + media.
- *Decoder* (Nilay Patel, The Verge).
- *Big Technology Podcast* (Alex Kantrowitz).
- *Acquired* (Ben Gilbert + David Rosenthal) — long-form business stories.
- *Stratechery Interviews* (Ben Thompson).
- *Sharp Tech* (Andrew Sharp + Ben Thompson).
- *The Diary of a CEO* (Steven Bartlett).
- *My First Million* (Shaan Puri + Sam Parr).
- *Lenny's Podcast* (Lenny Rachitsky).
- *20VC* (Harry Stebbings).

**Tier 2 / APAC:**

- *Asianometry*.
- *ChinaTalk* (Jordan Schneider).
- *The China Show*.
- *Tech Buzz China* (Rui Ma).
- *MoneyFM 89.3 Singapore*.
- *The Daily Cut* (CNA).

**Industry / niche:**

- *The Business* (KCRW, Kim Masters).
- *Variety After Show*.
- *Hollywood, the Sequel*.
- *Recode Media*.

### Named journalists on the beat

Maintain a working list in `data/state/media.json`. Examples to look out for (verify activity each run via their byline pages):

- **Variety:** Todd Spangler (streaming), Cynthia Littleton (business), Patrick Frater (Asia).
- **Deadline:** Nellie Andreeva (TV business), Peter White (international), Jesse Whittock.
- **THR:** Patrick Brzeski (Asia), Alex Weprin (business), Etan Vlessing.
- **Bloomberg:** Lucas Shaw (media newsletter — *Screentime*).
- **The Information:** Kaya Yurieff, Sahil Patel.
- **Campaign Asia:** Robert Sawatzky, Surekha Ragavan.
- **Mumbrella Asia:** Sham Majid.
- **Adweek:** Mark Stenberg (streaming).
- **TBI Vision:** Mark Layton.
- **C21Media:** Jonathan Webdale.
- **TechCrunch:** Sarah Perez (apps), Lauren Forristal (entertainment apps).

For each named journalist, the radar should answer: *what did they file in the last 30 days, and is there a pitch angle?*

### LinkedIn voices to engage

Maintain in `data/state/contacts.json`. The signal is: **who is publishing publicly about vertical / mobile / Asia content, where Tim's comment would land?**

Categories:

- **Streamer + studio C-suite** in Asia + globally.
- **Creator-economy investors** (a16z, Khosla, Sequoia Capital India, Lightspeed APAC).
- **Microdrama operators** (DramaBox, ShortMax, GoodShort, PineDrama leadership).
- **Asia-content executives** at Netflix, Amazon, Disney, Warner.
- **Brand CMOs** publicly thinking about mobile-first content.
- **Analysts** — Maria Rua Aguete (Omdia — Tim has a warm relationship), Naveen Chopra, Doug Shapiro.

### People Tim should publicly support

Each run, identify 1–2 people who:

- Are women / non-white / non-US founders working in vertical or Asian content who deserve amplification.
- Are publishing a fresh data point Tim can extend with a one-line stat from his own world.
- Are journalists Tim wants to be useful to (reposting their work *before* he ever asks for coverage).

### People Tim should privately message

Each run, identify 1–2 DMs where:

- The DM is **relationship-building**, not sales.
- There is a public signal that justifies the touchpoint (their new role, their new piece, their new fund).
- Tim has something specific and useful to offer (intro, data point, perspective).

### Reputation watch

- Search "Tim Oh" / "Timothy Oh" / "COL Group" / "ReelShort" / "FlareFlow" — any negative coverage, factual error, or unattributed Tim quote needs flagging in the brief.
- **Mandarin search:** "汤皓" / "COL集团" / "ReelShort" via Weibo / Baidu News.
- Watch for "microdrama dying" / "vertical video saturated" / "AI slop" / "Chinese soft power" narratives — opportunity for counter-POV.
- Check **Glassdoor / Maimai** quarterly for COL employee chatter that could surface in press.

### Visual / on-camera content opportunities (Category 21)

The radar must produce **at least one visual content idea per run** — Tim is in Hollywood for mobile phones, he can't stay text-only.

**Format library** (rotate, don't repeat):

- **Piece-to-camera** (30–90 sec): Tim talking to a phone, no edit, no music. One claim, one stat, one provocation. *"Why Australia is converting at 20%. Three reasons."*
- **Travel vlog beats**: LA trip, MIP, APOS, NEM, ATF, MIPCOM, FILMART. Daily ~60-sec packages — "Day 1, here's who I'm seeing, here's what's interesting." Tim plus location + people. **Always shoot when travelling.**
- **Behind-the-scenes from FlareFlow shoots**: Tim on set, with cast, with directors. The "vertical mogul actually makes the stuff" surface. Hengqin-Macau studio especially.
- **Reaction takes**: Tim watching DramaBox / Netflix vertical experiments / a brand microdrama campaign — sub-90-sec verdict. Stitchable, repostable.
- **Documentary-style explainers**: 2–3 min, slightly produced — "How a 90-second drama is made", "The 77-minute session, explained", "Why Australia broke our model".
- **Photo opps with caption**: Tim with Maria Rua Aguete, with Latif Sim, with Manjyot Sandhu, with cast. A photo + 60-word caption is a post.
- **Stage / panel pre-record**: Tim's panel opener delivered to camera before the event — gives the trade press a B-roll quote and extends the panel's life past the room.
- **Livestream / Spaces / Discord office hours**: monthly cadence, 30 min, vertical-content Q&A. Builds the "Tim is the place you go to learn this category" effect.

**Production reality:** Tim has a phone and a CTO (Enoch Chen). That's enough. No film crew required for 80% of these. The phone-shot-piece-to-camera is *more* native to vertical than a polished corporate video. Embrace it.

**Cadence target:** 1 weekly piece on LinkedIn / X, daily packages when travelling, monthly long-form.

### Critical mentions + contrarian framings (Category 22)

Every run, surface what people are saying **against** microdrama / vertical / Tim's frame. Don't ignore — engage.

**Critical voices to monitor:**

- **Hamilton Nolan**, **Jacob Silverman**, **Max Read** — left-media tech / culture skeptics.
- **The Hollywood Reporter** opinion pieces criticising "TikTok-ification" of film.
- **The Atlantic / New Yorker / NYT Magazine** — when they cover microdrama it's usually critical / framing-as-decline.
- **Letterboxd discourse** + film-Twitter — auteur-side dismissals.
- **Academic media studies** — Henry Jenkins (USC), Aymar Jean Christian — sometimes write thoughtfully on short-form.
- **YouTube essayists**: Lindsay Ellis, Patrick Willems, others — when they cover the category it's frame-shaping.
- **Chinese press critical of 短剧 出海**: when Chinese government / state press critique microdrama exports as "low quality" / "embarrassment abroad", Tim has to know.

**How to engage critical mentions:**

- **Co-opt, don't defend.** If someone calls microdrama "TikTok slop", Tim's move is *"They're not wrong about the worst examples — here's what separates the top decile."*
- **Steelman first**, then reply. Tim quoting a critic's actual frame and answering it lands harder than a counter-thread that pretends the critique didn't exist.
- **Pull critics into the conversation.** Inviting a skeptic onto a panel / podcast (or appearing on theirs) converts criticism into authority.
- **Never get into a defensive thread.** One response per critique, on Tim's home turf (LinkedIn / newsletter / podcast). Then move on.

### Out-of-the-box plays (Category 23)

The "what would a real mogul do" surface. Each run, propose at least one move that is **not** a press pitch / LinkedIn post / award submission.

**Examples:**

- **Live screening + Q&A in LA / NYC / London** — book a venue, screen the season-finale of a FlareFlow original, Tim on stage. Cinema-style.
- **Collab series with a non-microdrama creator** — a gaming streamer, a comedian, a chef. They get vertical-drama production; Tim gets their audience. *"Microdrama meets Gordon Ramsay" / "Microdrama meets Hasan Piker."*
- **A vertical-drama parody of a prestige drama** — Tim commissions a 90-second cut of *Succession* in vertical format as a stunt; releases the receipts on engagement.
- **Pop-up vertical-drama bar** at MIPCOM / Cannes — physical activation, Instagram-able.
- **A "Vertical Wrapped" annual data dump** — Spotify-Wrapped-style year-end summary of what the world watched, when, where.
- **Brand mash-up campaign** — *"What if Crocs commissioned a microdrama?"* — Tim builds the pitch deck for it publicly.
- **A Vertical Mogul podcast** — Tim interviews competitor founders + brand CMOs + creators in vertical. Owns the conversation by hosting it.
- **A signature physical thing** — Tim's jacket / glasses / colour palette. Recognisable on sight at trade events.
- **A book proposal** — "The Vertical Decade" / "Built for the Phone" — even a public proposal generates coverage before the book exists.
- **A "Top 50 in Vertical" list** Tim publishes annually — instant industry-organising mechanism.

**Rule:** at least one out-of-the-box play per quarterly cycle should be *taken seriously enough to scope*, not just floated.

### Partner discovery (Category 24)

Look beyond the known competitor cluster. Each run, surface 1–2 specific named potential partners.

**Where to find them:**

- **App store charts** — any entertainment / video app in Top 100 Grossing that's not a household name is worth a 5-min look.
- **TechCrunch / Crunchbase fundraises** in adjacent spaces (creator tools, short-form video, AI dubbing, mobile gaming, live shopping).
- **AngelList / Wellfound** — vertical-content / short-form startups hiring.
- **MIPCOM / NATPE / FILMART exhibitor lists** — every regional distributor is a potential partner.
- **YouTube + TikTok creators with 1–10M followers** in adjacent vertical-friendly genres (true crime, BookTok, mythology, romance) — these are talent pools, not just audiences.
- **Agencies + management cos** that have started repping vertical-native creators — UTA, CAA, WME, Talent X, Underscore Talent.
- **Indie production houses** in markets where COL is light: Brazil, Mexico, Turkey, Egypt, Vietnam, Indonesia.
- **Talent guilds + unions** as their stance on vertical evolves (SAG-AFTRA, etc.) — partnership-with-the-formal-industry signals.
- **Hardware partners** — Samsung, OPPO, Xiaomi (phone preinstalls); TCL / Hisense (TV-vertical hybrid surfaces).
- **Music labels + sync agencies** — Sony Music Publishing, Universal Music Group — sync deals could massively raise vertical-drama production value.

**Partner-fit heuristic:** does this org have audience or capability that COL doesn't? If yes, propose a specific reason for the first conversation.

---

## How to use this in a run

1. At the top of the run, **read this file in full**.
2. As you process intelligence + draft content + build the brief, **walk through the 24 categories above** as a checklist. Categories 21–24 (visual / critical / out-of-the-box / partner discovery) are the highest-priority additions — without them Tim stays a text-only CMO, not a vertical mogul.
3. If a category produced no signal this run, **say so explicitly** in the brief's "what changed" section. Silence is data.
4. Every public-facing opportunity (Pitch / Post / Comment / DM) should be **named with a specific person or outlet** — not "pitch a podcast", but "pitch *The Town* via Belloni's `tips@puck.news` with the Vertical 2.0 angle and the 238M-day stat."
5. **Respect the time budget.** Tim has ~5–8 hours of proactive brand time per week. "Act on this week" must be capped at **3 items maximum**, each with a rough time estimate. More than 3 = nothing gets done, and the brief loses authority.
6. **One visual content idea per run is mandatory.** Category 21 is not optional. If you can't propose a specific shootable moment (piece-to-camera topic, vlog beat, BTS shot, reaction take), the radar walk is incomplete.
7. Maintain proportion. A weekly brief should feel like a media-mogul's intelligence packet, not a clipping service.

---

## What disqualifies an opportunity

- It would have Tim sounding like a generic CMO.
- It requires inventing a relationship or interest that doesn't exist.
- It needs Tim to overclaim COL's position (no fake firsts, no fake exclusives).
- The evidence is weak and the recommended action is high-commitment.
- It's a category trap (commenting on Disney+ subscriber numbers when Tim has no contrarian angle).
- It exposes confidential commercial info.

If any of these are true, the action is **`Watch`**, **`Park`**, or **`Ignore`** — never **`Act now`** or **`Pitch`**.
