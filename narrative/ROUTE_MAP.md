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
