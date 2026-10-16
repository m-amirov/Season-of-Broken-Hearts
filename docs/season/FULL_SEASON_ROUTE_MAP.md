# Full Season Route Map

Источник topology: `narrative/season-architecture.json`. EP1 scene IDs remain
the executable baseline and are not renamed.

## Topology

```text
EP1 common core (route=none)
  -> EP2 public agreement / Bianca
  -> EP3 Leo truth / Aurea link
  -> EP4 wedding / staff cuts
  -> EP5 Elio service / career offer
  -> EP6 documents / informed explicit route-lock
       ├─ matteo      -> EP7–EP10 Matteo family
       ├─ leo         -> EP7–EP10 Leo family
       ├─ elio        -> EP7–EP10 Elio family
       └─ independent -> EP7–EP10 Nika family
  -> each route joins the same hotel decision protocol
  -> relationship ending × hotel outcome (21 legal pairs)
```

## Route lock contract

Before `ep6_route_choice`:

- `route=none` is the only legal route value.
- All four choices are visible and explicit.
- Trust and relationship values influence route-specific starting texture but
  cannot remove a route or silently choose one.
- The player may choose a person and separately refuse physical intimacy.

After `ep6_route_choice`:

- `routeLocked=true` and route never changes during the save.
- Only scenes guarded by the selected route can enter route-specific dialogue.
- `independent` has full scenes, a career objective and a positive ending.
- A route choice never changes `hotelOutcome` directly.

## Shared versus unique content

Shared content is permitted for external Villa events: the Aurea deadline,
the anniversary logistics and the public forum. A shared event must have a
route-conditioned version of its interpersonal conflict. For example, the
public forum is about Matteo's disclosure on his route, Leo's ethical testimony
on Leo's route, Elio's staff/career balance on Elio's route and Nika's public
professional authorship on the independent route.

The following content is never shared by substitution:

| Route | Unique emotional engine | Unique career engine | Unique final action |
|---|---|---|---|
| Matteo | control → delegation → partnership | open the ledger and hand over authority | sign a shared future plan with no employment condition |
| Leo | memory → accountability → present trust | Aurea career versus heritage practice | choose a new relationship after verified action |
| Elio | warmth → clarity → two ambitions | restaurant launch and distance plan | choose a life with two kitchens or release each other |
| Independent | guardedness → self-authorship → open future | event portfolio and next role | accept a career step without romantic consolation |

## Route-specific dependency map

| Route | Required antecedents | Optional enhancers | Critical failure branch |
|---|---|---|---|
| Matteo | EP6 route choice; Matteo terms witnessed; public boundary acknowledged | accepted contract, staff advocacy, delegation choice | control preserved → `matteo-goodbye` |
| Leo | EP3 truth scene; Aurea link seen; EP6 route choice | verified follow-through, heritage plan | Aurea convenience or evasion → `leo-echo` |
| Elio | EP5 offer disclosed; clarity choice; EP6 route choice | team-led service, hybrid schedule | unplanned departure/avoidance → `elio-separate-kitchens` |
| Independent | EP6 explicit selection; portfolio scene | external client, staff plan, transparent forum | no relationship failure state; business can still fail |

## Hotel independence from romance

The route graph passes a separate business state through every branch. The
same relationship ending can be paired with any of the three hotel outcomes
if the player makes the corresponding business choices. A route-specific scene
may add evidence, but no `endingId` guard is allowed on hotel resolution and no
`hotelOutcome` guard is allowed on relationship resolution.

## Illegal transitions

- `route=none` in EP7–EP10.
- Switching from one selected route to another after EP6.
- Entering Leo scenes without `leoAureaLinkKnown` or an explicit route-lock
  context.
- Treating `relationshipX>=N` as consent.
- Resolving a final ending before the EP10 route-specific final scene.
- Using `hotelOutcome` to choose a relationship final.
