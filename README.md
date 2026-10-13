# Season of Broken Hearts

## Локальный запуск

Обычный режим доступен только на этом компьютере:

```powershell
npm run dev
```

Для проверки на телефоне или другом устройстве в доверенной домашней сети:

```powershell
npm run dev:lan
```

Сервер покажет адрес `Network`. Откройте на телефоне:

```text
http://<LAN-IP-компьютера>:4173/
```

Компьютер и телефон должны быть в одной сети. На Wi-Fi-роутере не должно быть включено `guest/client isolation`; порт не следует пробрасывать в интернет. Проверьте фактический IPv4 компьютера в выводе `npm run dev:lan` и убедитесь, что Windows Firewall разрешает входящие TCP-подключения для частной сети.

Если Windows Firewall блокирует подключение, временно добавьте правило PowerShell от имени администратора:

```powershell
New-NetFirewallRule -DisplayName "Season of Broken Hearts dev-server 4173" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4173 -Profile Private -RemoteAddress LocalSubnet
```

После тестирования удалите правило:

```powershell
Remove-NetFirewallRule -DisplayName "Season of Broken Hearts dev-server 4173"
```

LAN-режим предназначен только для доверенной локальной сети. Сохранения в браузере телефона хранятся в его собственном `localStorage` и не переносятся автоматически с компьютера.
