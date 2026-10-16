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
| 2–3 | EP2 | Workday, wedding budget, Giulia's rehearsal and staff consequences | Nika, Matteo, Giulia, staff | Nika sees the cost of each budget choice and Giulia's own plan |
| 4–6 | EP2 | Public agreement is offered or refused; Bianca arrives as Aurea representative | Nika, Matteo, Bianca, family | `publicAgreement` is consented or declined; Bianca's business case can be learned without romantic consent |
| 7–8 | EP2 | Public boundary and rehearsal failure | Nika, Matteo, family, staff | `matteoPublicGesture` is separate from the contract; staff and family react to the chosen limits |
| 9 | EP2 | Seven-day public window closes on the rooftop | Nika, Matteo | Agreement is ended explicitly; later public intimacy requires fresh consent |
| 10–12 | EP3 | Archive, Villa Serena survey and Leo's eight-year account | Nika, Leo, staff | Leo's departure is his responsibility; report action is known only on the played branch |
| 13–14 | EP3 | Aurea mark and document check | Nika, Leo | Drawing is an unverified lead; `leoEvidence=terms` exists only after the attachment is checked |
| 15–16 | EP3 | Disclosure boundary with Matteo and transition | Nika, Matteo, Leo as relevant | Verified evidence or an explicitly limited lead is shared only if Nika chose to disclose it |
| 17–20 | EP4 | Wedding evening and public gesture | Nika, Matteo, family | Public boundary is remembered; no automatic private consent |
| 21–23 | EP4 | Staff cuts appear | Nika, staff, Matteo/Bianca | `staffCutsKnown` requires a staff list or direct disclosure |
| 24–30 | EP5 | Restaurant service and Elio offer | Nika, Elio, staff | Elio's restaurant option is known only after the offer scene |
| 31–36 | EP6 | Terms, Leo role, explicit route lock | Nika, all relevant actors | Exclusive conditions and route choice become known |
| 37–44 | EP7 | Route-specific first future conversation | selected route cast | Knowledge is route-local except investor deadline |
| 45–51 | EP8 | Career decisions and budget gap | selected route cast, staff | `budgetGapKnown` follows the alternative-budget review |
| 52–64 | EP9 | Anniversary and public forum | all needed for forum | `publicTruthKnown` follows the disclosure choice |
| 65–70 | EP10 | Final decisions and departure | route cast, Bianca/Matteo | Final relationship and hotel decisions are both recorded |
| +6 months | EP10 epilogue | Result of chosen relationship and hotel plan | route-dependent | No new past-tense facts are used to rewrite the summer |

## EP2 agreement contract

Matteo first raises the public agreement in `ep2_fake_terms` on day 4, after
Nika has already seen the work and family cost of the wedding. It covers only
the public-facing wedding preparation and events inside days 4–9. Nika may
accept public terms, negotiate limits, or refuse; refusal preserves her job,
professional access and the EP3 transition. A declined public gesture never
changes a previously consented contract.

The agreement is not a promise of touch, kissing, sex or a future relationship.
When Nika closes it in `ep2_rooftop_after` on day 9, `fakeDatingStatus` becomes
`ended` and no later scene may treat the old arrangement as active. EP4 may
contain a new public request only if it asks for fresh consent on that day's
terms; it cannot inherit consent from EP2.

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
