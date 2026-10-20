# EP2 `ep2_rehearsal_failure` — first bounded art batch

Статус: **MECHANICAL_PASS_SCOPED_PIXEL_REVIEW_INDEPENDENT_ACCEPTANCE_PENDING**.

Создана ровно одна dual-format пара на exact HEAD `fcf6b21cd9ae47c45f101d8937f1c35aa8f7eabe`:

- portrait `1024×1536`, SHA-256 `89e039b5138510df392e5c7b59dfe915003d5e316740a983d5a24d03dfb3d798`;
- landscape `1672×941`, SHA-256 `ba091839228a10a11b06ef31dd8c43764ee8fe2a256b978f15916eaeaa649bda`.

Оба файла — реальные PNG bytes, прошли `PASS_ART_OUTPUT_TRANSPORT` и `PASS_ART_OUTPUT_MECHANICAL`. Native producer route подтверждён официально: `PASS_NATIVE_AGENT_ROUTE_HOST_OBSERVED`, Terra Medium, trace SHA-256 `73cafbb48aee6915eacb7e9b4887bd6f8e594676d869cd5f821013c64eaf78bd`. Provider-level byte receipt не предоставлен.

Фактический просмотр обоих изображений показал читаемую тройку Nika/Matteo/Giulia, service corridor/freezer action и независимые portrait/landscape compositions; видимых P0/P1 дефектов при scoped parent review не обнаружено. Это **не художественный PASS**: Web независимая приёмка недоступна, runtime desktop/mobile QA ещё не выполнен, `narrative/assets.json` и runtime mapping не менялись.

Пара сохранена как first-batch output; accepted EP2 bytes и исторические evidence не перезаписывались.
