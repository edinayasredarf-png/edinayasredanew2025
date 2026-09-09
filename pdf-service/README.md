# kp-pdf-service — конвертация DOCX → PDF

Отдельный микросервис на LibreOffice headless. **Не связан** со `speech-service`
(речевая аналитика не меняется). Может жить на том же сервере — просто отдельный
контейнер и порт.

## Endpoints
- `POST /v1/convert` — тело запроса = байты `.docx`, ответ = `application/pdf`.
  Заголовок `Authorization: Bearer <PDF_API_TOKEN>`.
- `GET /health` — проверка живости.

## Запуск (Docker)
```bash
cd pdf-service
docker build -t kp-pdf-service .
docker run -d --name kp-pdf \
  -p 8001:8001 \
  -e PDF_API_TOKEN="ПРИДУМАЙТЕ_ДЛИННЫЙ_ТОКЕН" \
  --restart unless-stopped \
  kp-pdf-service
```

Проверка:
```bash
curl -s http://localhost:8001/health
curl -s -X POST http://localhost:8001/v1/convert \
  -H "Authorization: Bearer ПРИДУМАЙТЕ_ДЛИННЫЙ_ТОКЕН" \
  --data-binary @template.docx -o out.pdf
```

## Подключение к сайту (Vercel env)
В переменных окружения проекта Next.js:
```
KP_PDF_SERVICE_URL=https://ваш-домен-или-ip:8001
KP_PDF_SERVICE_TOKEN=ПРИДУМАЙТЕ_ДЛИННЫЙ_ТОКЕН
```
Сервис должен быть доступен из интернета (Vercel-функции ходят снаружи). Рекомендуется
поставить за HTTPS-reverse-proxy (nginx/Caddy) и ограничить доступ по токену.

## Заметки
- Конвертация изолирована по профилю на каждый запрос → безопасно параллелить.
- Шрифты: Liberation Serif ≈ Times New Roman, Carlito ≈ Calibri, Caladea ≈ Cambria,
  DejaVu — покрытие кириллицы. Если в шаблоне специфический шрифт — добавьте его
  `.ttf` в образ (`COPY font.ttf /usr/share/fonts/truetype/ && fc-cache -f`).
- Пока `KP_PDF_SERVICE_URL` не задан — сайт продолжает отдавать DOCX, а на PDF
  вернёт понятную ошибку (DOCX-функционал не ломается).
