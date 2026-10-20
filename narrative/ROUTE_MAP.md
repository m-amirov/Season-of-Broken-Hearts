# Route Map — Season of Broken Hearts

## EP1 executable graph

```text
ep1_arrival
  → ep1_gate
      ├─ matteo_formal → ep1_matteo_formal_response ─┐
      └─ matteo_direct → ep1_matteo_direct_response ─┴→ ep1_matteo_welcome → ep1_kitchen
          ├─ elio_humor → ep1_elio_humor_response ───┐
          └─ elio_boundary → ep1_elio_boundary_response ─┴→ ep1_work_briefing → ep1_hotel_crisis
              ├─ hotel_numbers → ep1_hotel_numbers_response ─┐
              └─ hotel_staff → ep1_hotel_staff_response ─────┴→ ep1_harbor_walk → ep1_leo_entrance
                  → ep1_leo_choice
                      ├─ leo_hear → ep1_leo_hear_response ─────┐
                      └─ leo_distance → ep1_leo_distance_response ─┴→ ep1_hook (EP1 transition)
```

EP1 имеет 18 сцен и 8 выборов. Все 16 комбинаций выбора сходятся к одному
клиффхэнгеру после непосредственной реакционной сцены; ни один выбор не
закрывает Маттео, Лео, Элио или независимый путь. После объединения веток
`ep1_hook` добавляет одну state-conditioned строку: выбор условий Aurea
отражается через `hotelEvidence=numbers`, а разговор с командой — через
`hotelEvidence=staff`. Остальной клиффхэнгер остаётся общим.

## EP2–EP3 executable editorial topology

```text
EP2, days 2–9
ep2_morning_brief → ep2_wedding_budget
  ├─ ep2_budget_open → ep2_workday_inventory
  └─ ep2_budget_improvise → ep2_workday_inventory
→ ep2_family_rehearsal
  ├─ ep2_giulia_personal_plan → ep2_family_rehearsal_response
  └─ ep2_giulia_family_plan → ep2_family_rehearsal_response
→ ep2_fake_terms
  ├─ ep2_terms_public → ep2_public_agreement
  ├─ ep2_terms_limits → ep2_public_agreement
  └─ ep2_terms_decline → ep2_refusal_response → ep2_refusal_workday
      ├─ ep2_refusal_help_giulia → ep2_refusal_bianca_arrival
      └─ ep2_refusal_keep_role → ep2_refusal_bianca_arrival
→ ep2_bianca_arrives
  ├─ ep2_bianca_professional → ep2_bianca_professional_response
  └─ ep2_bianca_pushback → ep2_bianca_pushback_response
→ ep2_public_agreement / ep2_public_refusal
→ ep2_rehearsal_failure → ep2_rooftop_after → ep2_transition (day 9)

EP3, days 10–16
ep3_old_photo → ep3_survey_start
  ├─ ep3_survey_join → ep3_survey_join_response → ep3_survey_site_problem
  │   ├─ ep3_report_conflict → ep3_staff_walkthrough
  │   └─ ep3_hold_conflict → ep3_staff_walkthrough
  │       ├─ ep3_staff_route_record → ep3_eight_years
  │       └─ ep3_staff_route_compromise → ep3_eight_years
  └─ ep3_survey_decline → ep3_survey_decline_response → ep3_report_delivery
      ├─ ep3_review_report → ep3_eight_years
      └─ ep3_hold_report → ep3_eight_years
→ ep3_eight_years → ep3_accountability_choice
  ├─ ep3_accountability_listen
  ├─ ep3_accountability_action
  └─ ep3_accountability_distance
→ ep3_aurea_drawing
  ├─ ep3_mark_aurea_link → ep3_document_check
  └─ ep3_protect_process → ep3_document_check
→ ep3_document_check_response → ep3_matteo_confrontation
  ├─ verified Aurea attachment → share or keep private
  └─ unverified lead → share or keep private
→ ep3_quiet_return → ep3_transition (day 16)
```

## EP4–EP5 executable topology

```text
EP4, days 17–23
ep4_wedding_evening
  ├─ ep4_wedding_kiss
  ├─ ep4_wedding_gesture
  └─ ep4_wedding_stop
→ ep4_wedding_response → ep4_cut_list
  ├─ ep4_read_staff_list
  └─ ep4_ask_direct_disclosure
→ ep4_staff_room → ep4_staff_meeting
  ├─ ep4_protect_team
  └─ ep4_verify_budget
→ ep4_matteo_boundary
  ├─ ep4_keep_professional
  └─ ep4_name_personal_interest
→ ep4_transition (day 23)

EP5, days 24–30
ep5_service_start
  ├─ ep5_help_team
  └─ ep5_build_menu
→ ep5_service_response → ep5_service_crisis → ep5_supply_market
  ├─ ep5_save_staff
  └─ ep5_save_menu
→ ep5_elio_offer
  ├─ ep5_ask_offer_details
  └─ ep5_give_offer_space
→ ep5_offer_response → ep5_night_kitchen
  ├─ ep5_accept_kiss
  └─ ep5_choose_friendship
→ ep5_transition (day 30)
```

EP4 records fresh public choices in `lastChoice`; it never treats the EP2
agreement as active and never changes `route` or `routeLocked`. The cut-list
choice sets `staffCutsKnown=true` only after the list or direct disclosure is
played. EP5 sets `elioOfferKnown=true` only in `ep5_elio_offer`; the kiss or
friendship response is explicit and remains separate from Elio's career offer.
The remaining decision details stay in the current scene and do not create an
early route lock. EP6 must still present all four routes explicitly.

`publicAgreement` отвечает только за согласие на публичную договорённость;
`matteoPublicGesture` — за отдельный жест. Поэтому отказ от прикосновения не
переписывает согласие на договор. Договор закрывается в `ep2_rooftop_after`
на девятый день (`fakeDatingStatus=ended` при согласии); при отказе он не
возникает (`fakeDatingStatus=none`). Ни одна из веток EP2–EP3 не меняет
`route` и не создаёт route-lock до EP6.

`leoEvidence=terms` появляется только после проверки приложения Aurea.
`leoEvidence=drawing` означает неподтверждённую зацепку и не может быть
озвучено как установленный факт. Проверка, раскрытие и сохранение в тайне
разведены отдельными выборами.

## EP7 executable route families

EP7 starts only after the EP6 lock and keeps the selected route fixed:

```text
ep7_entry
  ├─ matteo      → ep7_matteo_market → ep7_matteo_ledger → ep7_matteo_boundary → ep7_matteo_wrap
  ├─ leo         → ep7_leo_archive → ep7_leo_records → ep7_leo_accountability → ep7_leo_wrap
  ├─ elio        → ep7_elio_night_kitchen → ep7_elio_trial_menu → ep7_elio_future_talk → ep7_elio_wrap
  └─ independent → ep7_independent_portfolio → ep7_independent_client → ep7_independent_team → ep7_independent_wrap
                                      \___________________________→ ep7_deadline → ep7_transition
```

Each route has an initiative, a boundary/refusal accepted without punishment,
and a distinct career consequence. The transition records no relationship
ending and now feeds the EP8 career-and-budget branch.

## EP8 executable route families

EP8 continues the EP6 lock and makes the career cost visible before the common
budget review:

```text
ep8_entry
  ├─ matteo      → ep8_matteo_delegation → ep8_matteo_family_ledger → ep8_matteo_stay_choice → ep8_matteo_wrap
  ├─ leo         → ep8_leo_aurea_conflict → ep8_leo_heritage_plan → ep8_leo_career_choice → ep8_leo_wrap
  ├─ elio        → ep8_elio_offer → ep8_elio_menu → ep8_elio_future → ep8_elio_wrap
  └─ independent → ep8_independent_budget → ep8_independent_partner → ep8_independent_career → ep8_independent_wrap
                                      \____________________________→ ep8_budget_crisis → ep8_transition
```

The route-specific choices never mutate `route`, `routeLocked` or
`routeLockSource`. Matteo's delegation, Leo's heritage plan, Elio's hybrid
schedule and Nika's authored portfolio provide distinct professional
consequences; their refusals remain playable and feed the same business
review. `ep8_budget_crisis` records `budgetGapKnown=true` and resolves only
the alternative budget as `viable` or `underfunded`; `ep8_transition` is an
episode boundary without `endingId`, leaving relationship and hotel finals to
EP9–EP10.

## EP9 executable anniversary and forum

EP9 keeps the EP6 lock, makes the budget crisis public, and lets each route
carry a different relationship and professional payoff into the final week:

```text
ep9_entry
  ├─ matteo      → ep9_matteo_anniversary → ep9_matteo_team_terms → ep9_matteo_forum_stance
  ├─ leo         → ep9_leo_anniversary → ep9_leo_team_terms → ep9_leo_forum_stance
  ├─ elio        → ep9_elio_anniversary → ep9_elio_team_terms → ep9_elio_forum_stance
  └─ independent → ep9_independent_anniversary → ep9_independent_team_terms → ep9_independent_forum_stance
                                      \________________________→ ep9_public_forum
  ep9_public_forum → route-specific payoff → ep9_transition
```

The forum exposes exactly three player-facing choices on every locked route:
full disclosure, verified facts only, or keeping details for the closed
meeting. These set `publicDisclosure` and the existing hotel evidence,
funding and staff-protection keys; none changes `route` or assigns a final
relationship/hotel outcome. The route payoffs offer a shared future or a
deliberate pause, then `ep9_transition` carries the state to EP10 planning
without an `endingId`.

## Full-season topology (planned)

- EP1–5: общее ядро, знакомство и романтические предпочтения.
- EP6: route-lock после информированного выбора Маттео / Лео / Элио /
  независимости.
- EP7–10: самостоятельные романтические истории плюс независимая бизнес-
  причинность Villa Serena.
- Финалы отношений: 7; исходы отеля: 3. До 21 сочетания состояния, но не 21
  отдельная финальная глава.

## State ownership

| Domain | Keys | EP1 owner |
|---|---|---|
| Route | `route` | остаётся `none` |
| Trust | `trustMatteo`, `trustLeo`, `trustElio` | выборы знакомства |
| Romance | `relationshipMatteo`, `relationshipLeo`, `relationshipElio` | только наблюдаемый отклик, без lock |
| Hotel | `staffTrust`, `fundingEvidence`, `investorTerms`, `hotelEvidence` | предъявленный документ или разговор с командой; `hotelEvidence` имеет отложенный payoff в `ep1_hook` |
| Knowledge | `met*`, `leoConversation`, `leoTruthHeard`, `askedAboutHotel` | scene provenance; полное объяснение Лео не в EP1 |
| EP4 knowledge | `staffCutsKnown` | только `ep4_cut_list`, после явного списка или прямого раскрытия |
| EP5 knowledge | `elioOfferKnown` | только `ep5_elio_offer`, после честного предложения ресторана |
| EP4–EP5 choice cursor | `lastChoice` | records the latest explicit choice; it does not select a route |

## Route-lock implementation

Подробные guards и reachability для route-lock реализованы в EP6: до
`ep6_route_choice` legal route только `none`, после выбора route фиксируется
вместе с `routeLocked=true` и `routeLockSource=ep6_route_choice`. В EP1–EP5
отсутствуют декоративный ранний route-lock и ложные концовки.
