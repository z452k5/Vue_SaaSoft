# Форма учетных записей — Vue 3 + TS + Pinia + TailwindCSS + Zod

## Запуск

```bash
npm i
npm run dev
```

## Важное

- Валидация полностью на **Zod**:
    - `editableAccountSchema` проверяет:
        - `login` обязателен, максимум 100 символов
        - `type` ∈ {LDAP, Локальная}
        - для `Локальная` — `password` обязателен, максимум 100 символов
        - `labelInput` — каждая метка ≤ 50 символов
    - `toLabelTags()` превращает строку меток в массив `{ text }` перед сохранением.
- Сохранение в **Pinia** и persist в `localStorage`.
- Пароль при `LDAP` скрыт и сохраняется как `null`.
- Валидация срабатывает на `blur`/`change` и маппит ошибки Zod в поля UI.
