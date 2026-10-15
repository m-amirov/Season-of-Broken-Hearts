# Episode Production Plan — EP2–EP10

Этот документ переводит beat sheet в production-ready список сцен. Он не
является отдельным графом: стабильные IDs и route/state requirements должны
сверяться с `narrative/season-architecture.json`, а после Phase 9.2 — с
собранным executable graph.

## Общий scene contract

Каждая сцена обязана иметь `id`, `episode`, `dayStart`, `dayEnd`, `location`,
`wardrobeFamily`, `entryGuard`, `dialogue.ru`, `dialogue.en`, `choices` и
`exit`. Choice обязан указывать понятный игроку вопрос, immediate reaction,
state effect, delayed payoff и legal back/save boundary. Смена локации или дня
оформляется отдельной transition-сценой, не скрытой сменой background.

RU — авторский текст; EN — полноценная локализация с тем же действием,
подтекстом и ограничениями, но не машинная калька. Одна ветка не получает
знаний из другой ветки только потому, что у scene ID совпадает суффикс.

## EP2 — production slice

| Scene ID | Time / place | Function | Choice and effect |
|---|---|---|---|
| `ep2_morning_brief` | day 2, Villa hall | Nika receives wedding schedule and sees staff gap | Ask for authority → `nikaCareerPlan=villa-season`; ask for staff voice → `staffTrust+1` |
| `ep2_wedding_budget` | day 3, office | Concrete budget pressure, no romance shortcut | Cut guest experience / cut non-essential spend / find partner → `budgetPlan` branch |
| `ep2_family_rehearsal` | day 4, courtyard | Introduces sister and family pressure | Mediate / refuse family role / support sister privately → `matteoTrust`, `staffTrust` |
| `ep2_fake_terms` | day 5, library | Matteo offers seven-day public agreement | Accept / decline / counter with written boundaries → `fakeDatingStatus`, `fakeDatingTermsKnown` |
| `ep2_bianca_arrives` | day 6, entrance | Bianca enters as Aurea representative | Private meeting / direct questions / defer → `biancaRoleKnown`, `aureaClientKnown` |
| `ep2_public_agreement` | day 7, terrace | Shows agreement as bounded public action | Hand / verbal introduction / stop the scene → `matteoPublicGesture`, no automatic romance |
| `ep2_rehearsal_failure` | day 8, service corridor | Staff shortage has visible consequence | Protect team / protect schedule / disclose gap → `staffTrust`, `staffCutsKnown` |
| `ep2_rooftop_after` | day 9, rooftop | Nika states what the agreement does not mean | Slow pace / end agreement early / continue seven days → boundary state |
| `ep2_transition` | day 9, staff room | Schedule opens Leo survey slot | No choice; preserves `route=none` |

**Acceptance:** agreement refusal still reaches Bianca's information; no
`route` effect exists; all scenes localized and save-safe.

## EP3 — production slice

| Scene ID | Time / place | Function | Choice and effect |
|---|---|---|---|
| `ep3_old_photo` | day 10, archive | Nika chooses whether to keep a shared memory | Keep / return / ask who kept it → `leoConversation` |
| `ep3_survey_start` | day 11, old port | Establishes why Leo is physically at Villa Serena | Observe work / ask client / leave → knowledge only follows chosen cue |
| `ep3_eight_years` | day 12, harbor | Leo gives the full chronology | Listen / demand timeline / end talk → `leoPastExplained`, `leoAccountability` |
| `ep3_accountability_choice` | day 13, seawall | Nika names the damage without promising forgiveness | Ask what he would do now / ask why he hid it / distance → `leoRepairChoice` |
| `ep3_aurea_drawing` | day 14, survey room | Aurea mark becomes player-visible | Inspect with Leo / inspect alone / refuse access → `leoAureaLinkKnown` |
| `ep3_matteo_confrontation` | day 15, office | Matteo must explain access and client boundary | Share document / keep private / require written rule → `investorTerms`, `matteoTrust` |
| `ep3_quiet_return` | day 16, Villa garden | Nika separates memory from present intention | No route lock; `route=none` |
| `ep3_transition` | day 16, office | Wedding weekend begins | `staffCutsKnown` may become true only if EP2/EP3 evidence exists |

## EP4 — production slice

| Scene ID | Time / place | Function | Choice and effect |
|---|---|---|---|
| `ep4_wedding_setup` | day 17, courtyard | Public role is rehearsed as work, not ownership | Delegate / control / ask sister → `matteoTrust`, `nikaCareerPlan` |
| `ep4_family_pressure` | day 18, family room | Bianca and family frame Nika's public role differently | Correct them / leave / negotiate terms → `fakeDatingTermsKnown` |
| `ep4_public_moment` | day 20, terrace | Consent is explicit before a public gesture | Kiss / hold hands / stop → `matteoPublicGesture`, relationship only on kiss/hand |
| `ep4_after_public` | day 20, side garden | Matteo acknowledges the chosen boundary | Accept explanation / require repair / end public role → `matteoCommitment` |
| `ep4_staff_rumor` | day 21, staff room | First credible cuts information | Ask staff / ask Bianca / ask Matteo → `staffCutsKnown`, `staffTrust` |
| `ep4_cut_list` | day 22, office | Nika sees affected roles | Record / challenge / refuse to carry list → `fundingEvidence`, `publicDisclosure=partial` only on disclosed facts |
| `ep4_wedding_close` | day 23, terrace | Wedding ends without relationship lock | Transition to Elio service crisis |

## EP5 — production slice

| Scene ID | Time / place | Function | Choice and effect |
|---|---|---|---|
| `ep5_restaurant_prep` | day 24, kitchen | Elio's professional standard is visible | Ask team / follow Elio / redesign service → `elioTrust`, `staffTrust` |
| `ep5_staff_conflict` | day 25, prep room | Workload disagreement has no villain | Hear both / choose speed / stop service → `staffTrust`, `budgetPlan` |
| `ep5_service_crisis` | day 27, dining room | Nika and Elio solve a real operational failure | Save face / protect team / cancel course → `fundingEvidence`, `elioTrust` |
| `ep5_after_kitchen` | day 28, night kitchen | Quiet intimacy after work | Joke / direct question / silence → relationship signal, not commitment |
| `ep5_elio_offer` | day 29, kitchen office | Elio reveals restaurant offer | Ask terms / congratulate / ask what he wants → `elioRestaurantOfferKnown` |
| `ep5_choice_kiss_or_friendship` | day 30, night kitchen | Consent and clarity beat romantic reward | Kiss / time / friendship → `elioClarityChoice`, `relationshipElio` |
| `ep5_transition` | day 30, Villa office | Matteо calls a documents meeting | All routes still `none` |

## EP6 — route-lock slice

| Scene ID | Time / place | Function | Choice and effect |
|---|---|---|---|
| `ep6_document_found` | day 31, office | Nika finds the sealed terms | Open / return / call witness → `exclusiveTermsSeen` only after reading or witnessed disclosure |
| `ep6_terms_read` | day 32, library | Aurea's control and cuts become concrete | Mark clauses / ask Bianca / ask staff → `investorTerms=exclusive`, `fundingEvidence` |
| `ep6_leo_role` | day 33, meeting room | Leo's professional role is stated | Ask recusal / ask deliverables / end access → `aureaClientKnown`, `leoAureaLinkKnown` |
| `ep6_all_three_confront` | day 34, office | Nika rejects triangulation | One-on-one repairs / public meeting / leave → all consent/boundary keys preserved |
| `ep6_nika_boundary` | day 35, pier | Nika names the future she can and cannot offer | No state shortcut; creates explicit route-choice context |
| `ep6_route_choice` | day 36, pier | Four human-readable route choices | Set exactly one of `matteo`, `leo`, `elio`, `independent`; set `routeLocked=true` |
| `ep6_route_matteo` | day 36, Villa office | Matteo route asks for shared ledger | `matteoCommitment=public-contract` |
| `ep6_route_leo` | day 36, archive | Leo route asks for verified timeline | `leoCommitment=reopened` |
| `ep6_route_elio` | day 36, kitchen | Elio route asks for clear future talk | `elioCommitment=curious` |
| `ep6_route_independent` | day 36, event room | Nika route starts her portfolio | `independentProgress=portfolio` |

## EP7–EP10 route-specific production plan

The four route families below are separate authored scene sets. Shared business
scenes may reuse event facts, but never reuse a romantic conversation with a
name substitution.

### Matteo family

| Episode | Scene IDs | Dramatic work | Required payoff |
|---|---|---|---|
| EP7 | `ep7_matteo_market_date`, `ep7_matteo_open_ledger`, `ep7_matteo_truth` | Matteo lets Nika see a real operating choice and accepts a boundary | `matteoTrust`, `matteoCommitment=shared-ledger` |
| EP8 | `ep8_matteo_delegation`, `ep8_matteo_family_ledger`, `ep8_matteo_stay_choice` | He delegates or reclaims control under pressure | `matteoCareerChoice=delegation` or `control` |
| EP9 | `ep9_matteo_forum`, `ep9_matteo_future_offer` | Public truth and a future offer without employment leverage | `matteoCommitment=mutual-plan` or `ended` |
| EP10 | `ep10_matteo_final`, `ep10_matteo_epilogue` | Hope or goodbye is enacted in a concrete work/life plan | `endingId=matteo-hope|matteo-goodbye` |

### Leo family

| Episode | Scene IDs | Dramatic work | Required payoff |
|---|---|---|---|
| EP7 | `ep7_leo_archives`, `ep7_leo_site_walk`, `ep7_leo_choice` | Leo offers evidence and Nika tests it against action | `leoTrust`, `leoAccountability=verified` only after follow-through |
| EP8 | `ep8_leo_aurea_conflict`, `ep8_leo_heritage_plan`, `ep8_leo_career_choice` | He chooses career ethics over a convenient title or explains refusal | `leoCareerChoice=heritage-plan|aurea` |
| EP9 | `ep9_leo_public_forum`, `ep9_leo_future_offer` | He speaks about the past without using it as leverage | `leoCommitment=mutual-plan|ended` |
| EP10 | `ep10_leo_final`, `ep10_leo_epilogue` | Second chance or deliberate non-return | `endingId=leo-second-chance|leo-echo` |

### Elio family

| Episode | Scene IDs | Dramatic work | Required payoff |
|---|---|---|---|
| EP7 | `ep7_elio_trial_menu`, `ep7_elio_night_kitchen`, `ep7_elio_offer` | Nika sees the restaurant dream as work, not fantasy | `elioTrust`, `elioCommitment=clear-choice` |
| EP8 | `ep8_elio_offer`, `ep8_elio_menu`, `ep8_elio_future` | Elio offers a workable hybrid plan or leaves without one | `elioCareerChoice=hybrid-plan|unplanned-departure` |
| EP9 | `ep9_elio_service`, `ep9_elio_future_offer` | He gives Nika a choice that does not demand rescue | `elioClarity=discussed|avoided` |
| EP10 | `ep10_elio_final`, `ep10_elio_epilogue` | Shared table or separate kitchens | `endingId=elio-table-for-two|elio-separate-kitchens` |

### Independent family

| Episode | Scene IDs | Dramatic work | Required payoff |
|---|---|---|---|
| EP7 | `ep7_independent_portfolio`, `ep7_independent_client`, `ep7_independent_vow` | Nika earns a client and makes a promise to herself | `independentProgress=portfolio` |
| EP8 | `ep8_independent_budget`, `ep8_independent_partner`, `ep8_independent_career` | She negotiates without turning work into martyrdom | `nikaCareerPlan=portfolio`, `alternativeBudget` branch |
| EP9 | `ep9_independent_forum`, `ep9_independent_staff`, `ep9_independent_future` | She protects truth and team without romance as reward | `independentProgress=self-authored` |
| EP10 | `ep10_independent_final`, `ep10_independent_epilogue` | A full ending, not a refusal screen | `endingId=nika-own-way` |

## Production batches and barriers

1. **Batch A:** author and validate EP2–EP3, including RU/EN and all common
   state effects; no route-specific art production.
2. **Batch B:** author and validate EP4–EP5; review consent, staff knowledge and
   Elio career continuity.
3. **Batch C:** author EP6, implement route-lock, run route explorer for all
   four routes before opening EP7.
4. **Batch D:** author EP7–EP8 route families; review each route independently.
5. **Batch E:** author EP9–EP10 and run full ending reachability.

The current Phase 9.1 output does not change `game-spec.yaml` or claim any
episode beyond EP1 as implemented.
