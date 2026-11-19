# Leonida Legend — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/whatever7410258/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/whatever7410258/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies in Grand Theft Auto VI — one platinum, two gold, six silver and 46 bronze — built for the make.fun bounty `gta6-trophy-guide-01`.

## What it is

- **Every trophy, with a guide in my own words.** Each of the 55 trophies shows its official name, description and grade exactly as PlayStation publishes them, plus a guide that says what to do, where and how, and when it can be missed — with its sources named beside it. Two trophies had no confirmed method at launch (Bad Luck, I Guess and Ten Pin); their guides say so plainly instead of guessing.
- **A roadmap to the platinum.** Three stages — story (60–80 hours), the 100% checklist (about 100 hours), cleanup (about 10 hours) — with the trophies listed under the stage they belong to, and the 100% checklist counts spelled out.
- **One missable trophy, flagged everywhere.** Positive Mental Attitude needs a Chapter 1 balcony meditation that vanishes when the chapter ends. It is flagged in the list, in its guide, in a banner at the top of the page, and in the roadmap.
- **A tracker that remembers.** Tick trophies off and your progress is saved in the browser (localStorage), with export to a file and import back. Filters cover story, missable, collectibles, activities and online (there are no online trophies — the filter says so), plus grade and text search.
- **A spoiler setting.** With spoilers hidden, story trophies show as "Hidden story trophy" until you earn them; switch it off to see the full list.
- **Fully offline.** Plain static files under `app/` — no build step, no network request at run time. The only links out are the source citations, which open only if you follow them.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

## Build the hand-in

```sh
MAKEFUN_OUTPUT_DIR=/tmp/tg-out node main.ts   # writes /tmp/tg-out/dossier.json
```

## Sources

Trophy names, descriptions and grades are the official PS5 list as tracked by PSNProfiles and Exophase. The methods are written in my own words from PowerPyx's GTA 6 Trophy Guide & Roadmap, cross-checked against Sixshore, GTA Zone, KeenGamer, Planet GTA 6 and Output Lag. Each trophy's guide names its sources beside it.

Unofficial fan guide — not affiliated with, endorsed by, or connected to Rockstar Games. No Rockstar logo, artwork or game imagery is used anywhere.

---

<sub>Entered on [make.fun](https://make.fun/?ref=w9y8tk6d&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
