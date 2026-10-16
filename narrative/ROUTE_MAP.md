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

## Planned route locks

Подробные guards и reachability для route-lock будут добавлены вместе с
эпизодом 6. В EP1 отсутствует декоративный ранний route-lock и отсутствуют
ложные концовки.
