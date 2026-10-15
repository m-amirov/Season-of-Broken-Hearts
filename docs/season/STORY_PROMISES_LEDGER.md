# Full Season Story Promises Ledger

`narrative/story-promises.json` remains the source-bound EP1 ledger. This
document extends it for planning without changing the authored EP1 payoff.
Statuses here are `planned` until the corresponding episode scene exists in
production data and has runtime evidence.

| ID | Setup | Reinforcement | Payoff | Route scope | Status |
|---|---|---|---|---|---|
| `ep1-villa-crisis` | `ep1_hotel_crisis` / `ep1_hook` | EP4 cut list | EP6 terms, EP9 forum, EP10 hotel result | all | authored + planned extension |
| `ep1-leo-return` | `ep1_leo_entrance` | EP3 old photo | EP3 account and EP10 Leo ending | Leo / non-Leo acknowledgement | authored + planned extension |
| `matteo-negotiation-documents` | `ep2_fake_terms`, `ep6_terms_read` | EP4 partial disclosure | EP9 public forum and EP10 business result | all | planned |
| `elio-restaurant-departure` | `ep5_elio_offer` | EP7 offer, EP8 future plan | EP10 Elio ending / route-neutral acknowledgement | Elio / all routes hear only if disclosed | planned |
| `season-hotel-outcome` | `ep1_hotel_crisis` | EP4 cuts, EP8 budget gap | `ep10_hotel-resolution` | all | planned |
| `bianca-not-villain` | `ep2_bianca_arrives` | EP6 terms, EP9 forum | Bianca states the business case and accepts/executes result | all | planned |
| `leo-aurea-link` | `ep3_aurea_drawing` | EP6 role | EP8 career choice and EP10 Leo outcome | Leo / disclosed external facts | planned |
| `matteo-control-cost` | EP2 agreement and EP4 hidden list | EP7 open ledger, EP8 delegation | `matteo-hope` or `matteo-goodbye` names the cost | Matteo | planned |
| `nika-career-recovery` | EP1 job reset | EP5 work competence, EP7–8 portfolio | EP10 career resolution in every route | all | planned |
| `route-choice-informed` | EP6 terms and boundary conversation | EP7 route-specific test | EP10 route ending | all | planned |
| `independent-life-not-punishment` | EP2 refusal remains safe, EP5 friendship option | EP7 portfolio and EP9 public work | `nika-own-way` | independent | planned |
| `anniversary-public-truth` | EP4 cut list | EP8 budget crisis | EP9 public forum | all | planned |

## Promise rules

- A setup must have a reachable antecedent on the same path.
- A payoff cannot read a flag from an unvisited branch.
- A promise may be acknowledged without being fulfilled only when the ledger
  explicitly marks the result as `intentionally-open`; none of the season's
  eight major promises use that status.
- `authored` in the inherited ledger is not runtime proof. `runtime-verified`
  will require actual executable scene IDs, route/state path evidence and
  current save/load proof.
- No promise is fulfilled by an ending identifier alone; each needs an authored
  scene with a changed emotional or practical situation.
