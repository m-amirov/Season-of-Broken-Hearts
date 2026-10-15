# Timeline and Knowledge Matrix

## Calendar contract

The contract is ten weeks / 70 days. EP1 starts on day 1. The anniversary is
held during days 52–64, leaving the last days for consequences and departure.
Each transition carries `day`, `location`, `presentCharacters` and
`knowledgeDelta`; no scene may infer travel, outfit change or private
conversation from a background swap.

## Event chronology

| Day | Episode | Event | Present | New knowledge with valid source |
|---:|---:|---|---|---|
| 1 | EP1 | Arrival, work offer, crisis, Leo returns | Nika, Matteo, Elio, Leo | Nika knows hotel is under pressure; Leo's client remains unknown |
| 2–5 | EP2 | Wedding preparation and terms conversation | Nika, Matteo, family | Nika knows public agreement is voluntary and limited if disclosed |
| 6–9 | EP2 | Bianca arrives and public agreement is tested | Nika, Bianca, Matteo | Bianca's Aurea role and investment rationale can be learned |
| 10–14 | EP3 | Leo explains past and survey link | Nika, Leo | Leo's choice to leave and Aurea mark become known only on played cues |
| 15–16 | EP3 | Access boundaries with Matteo | Nika, Matteo | Nika may know more about investor access, not all terms |
| 17–20 | EP4 | Wedding evening and public gesture | Nika, Matteo, family | Public boundary is remembered; no automatic private consent |
| 21–23 | EP4 | Staff cuts appear | Nika, staff, Matteo/Bianca | `staffCutsKnown` requires a staff list or direct disclosure |
| 24–30 | EP5 | Restaurant service and Elio offer | Nika, Elio, staff | Elio's restaurant option is known only after the offer scene |
| 31–36 | EP6 | Terms, Leo role, explicit route lock | Nika, all relevant actors | Exclusive conditions and route choice become known |
| 37–44 | EP7 | Route-specific first future conversation | selected route cast | Knowledge is route-local except investor deadline |
| 45–51 | EP8 | Career decisions and budget gap | selected route cast, staff | `budgetGapKnown` follows the alternative-budget review |
| 52–64 | EP9 | Anniversary and public forum | all needed for forum | `publicTruthKnown` follows the disclosure choice |
| 65–70 | EP10 | Final decisions and departure | route cast, Bianca/Matteo | Final relationship and hotel decisions are both recorded |
| +6 months | EP10 epilogue | Result of chosen relationship and hotel plan | route-dependent | No new past-tense facts are used to rewrite the summer |

## Character knowledge boundaries

| Fact | First valid source | Matteo | Leo | Elio | Bianca | Staff |
|---|---|---|---|---|---|---|
| Villa financial pressure | EP1 crisis | knows before Nika | observes site concern | knows operationally | knows through Aurea | partial lived impact |
| Bianca represents Aurea | EP2 arrival | knows | learns only if told/meeting | learns through staff or Nika | knows | partial |
| Fake agreement terms | EP2 private contract | author | not automatic | not automatic | knows public scope, not private boundaries unless told | sees public result only |
| Leo left eight years ago by choice | EP3 account | not automatic | knows | not automatic | not relevant | no |
| Leo survey is Aurea-linked | EP3 drawing / EP6 role | knows by EP6 | knows | only if scene shares | knows | no |
| Staff cuts are on offer | EP4 disclosure/list | knows | only if told | knows from team | knows | knows their own risk |
| Elio has restaurant offer | EP5 offer | not automatic | not automatic | knows | not necessarily | hears only if Elio shares |
| Exclusive control terms | EP6 terms read | knows | knows if disclosed | knows if disclosed | source owner | no until public forum |
| Alternative budget gap | EP8 budget review | knows if meeting played | knows if told | knows if route scene shares | knows | knows practical impact |
| Public truth | EP9 forum | knows disclosed version | same | same | knows official response | hears public version |

## State provenance rules

1. A `knowledge` key is set only by a scene that contains the source event.
2. Shared knowledge requires an authored disclosure line or a played public
   event; proximity to a scene is not enough.
3. Private route scenes may alter route-specific trust but cannot set another
   route's private knowledge.
4. `Back` restores knowledge and one-shot actions with the pre-command snapshot.
5. Changing locale may replace text but never changes knowledge, day, route or
   ending conditions.

## Wardrobe and presence continuity

The first production art pass will bind each scene family to a wardrobe family:
`wedding-prep`, `wedding-formal`, `survey-day`, `kitchen-service`,
`route-date`, `business-meeting`, `anniversary`, `departure`, `epilogue`.
The route map cannot enter a later family without an explicit transition and
the wardrobe manifest must be checked separately from narrative reachability.
