# Route Map — Season of Broken Hearts

## EP1 executable graph

```text
ep1_arrival
  → ep1_gate
      ├─ matteo_formal ─┐
      └─ matteo_direct ─┴→ ep1_matteo_welcome → ep1_kitchen
          ├─ elio_humor ───┐
          └─ elio_boundary ┴→ ep1_work_briefing → ep1_hotel_crisis
              ├─ hotel_numbers ─┐
              └─ hotel_staff   ─┴→ ep1_harbor_walk → ep1_leo_entrance
                  → ep1_leo_choice
                      ├─ leo_hear ─────┐
                      └─ leo_distance ─┴→ ep1_hook (EP1 transition)
```

EP1 имеет 10 сцен и 8 выборов. Все 16 комбинаций выбора сходятся к одному
клиффхэнгеру; изменения видны в репликах/следующем состоянии, но ни один выбор
не закрывает Маттео, Лео, Элио или независимый путь.

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
| Hotel | `staffTrust`, `fundingEvidence`, `investorTerms` | конфликт дня 1 |
| Knowledge | `met*`, `leoTruthHeard`, `askedAboutHotel` | scene provenance |

## Planned route locks

Подробные guards и reachability для route-lock будут добавлены вместе с
эпизодом 6. В EP1 отсутствует декоративный ранний route-lock и отсутствуют
ложные концовки.
