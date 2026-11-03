# STORY BIBLE (provisional: names are placeholders until the designer approves)

Theme: what we protect, and who we protect it from, when the thing we fight is only trying to go home.
Tone: understated, concrete, quietly funny, occasionally devastating. No villain monologues, lore dumps, meme humor.

## Cast (role IDs)
| ID | Who | Function |
|---|---|---|
| FOREMAN | The player, a beaver; near-silent, speaks through choice buttons | the hands on the dam |
| CREW_GATHERER, CREW_MASON, CREW_DIGGER, CREW_QUARRYMAN, CREW_WATCHER | The crews; each has one running subplot tied to its mechanic | warmth and humor; WATCHER knows the sea best |
| ANTAGONIST_01 (THE REEVE) | The valley official who hired the foreman | funds the dam, hides what the old maps show, wants the sea held at any cost |
| THE SEA | Not a villain: a presence with its own motif | the real question of the game |
| PREDECESSORS | Earlier foremen whose ruins lie in the silt | the reveal |

## The hidden layer (lock before writing)
The sea is not rising. It is returning to its old bed, and the valley sits in that bed. Each dam holds the sea out of its own home. Every earlier foreman figured this out and quit at the Ocean tier. The Reeve knows from the old maps.

## Clue schedule (12 relics, each unlocked at lifetime silt 15, 40, 80, 140, 220, 330, 470, 640, 850, 1100, 1400, 1800)
Beats only; the writer produces <= 3-line final text.
R01 a beam chewed by beavers, older than the dam. R02 a crew member says the water remembers. R03 a map of the valley whose contour matches the coastline. R04 a predecessor's tally of tides, stopping mid-count. R05 a sluice with an inscription worn smooth. R06 a ledger: the Reeve's office paid every foreman. R07 villagers' markers climbing uphill year after year. R08 a predecessor's note: it is not rising, it is returning. R09 an old riverbed cross-section under the valley. R10 a child's toy found in the deepest silt: the valley was lived in before the dam. R11 a letter from the last foreman to the next. R12 the sea's own motif plays once without the dam noise.

## Endings
Hold (clear Ocean): the valley survives, the sea cannot come home; bittersweet. Release (>= 6 relics, open the sluice): the valley floods into the old bed; people relocate; the dam becomes a bridge. Terrace (12 relics + 500 silt): channels give the sea its bed and the valley moves uphill; nobody lost. Each ending shows a final still and a 10 s music cue.

## Audio motifs
FOREMAN: warm 5-note motif (scale degrees, data). Crews: variations on different instruments. THE REEVE: the FOREMAN motif inverted and slowed. THE SEA: long rising two-note pedal that grows as pressure grows; resolves only in the Terrace ending.

## Writing batches
20 relic/event entries per batch; JSON schema {id, trigger:{siltLifetime|tier|flag}, speaker, lines[<=3], sets:[flags], requires:[flags]}. Auditor runs a continuity pass; tools/story-lint.js validates schema, dead ends, unreachable nodes, line length.
