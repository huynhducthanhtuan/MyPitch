# MyPitch — Player Journal

A React + TypeScript + Vite frontend for recording fixtures, updating results, and tracking goals, assists, and playing time by year and month.

## Run the application

```bash
npm install
npm run dev
```

When MockAPI is not configured, the application runs in preview mode and stores data in the browser's `localStorage`. A banner on the page indicates this mode.

## Connect to MockAPI

1. Create a project on [MockAPI](https://mockapi.io/) and create a resource named `matches`.
2. Create a `.env.local` file in the project root:

   ```env
   VITE_MOCKAPI_URL=https://<project-id>.mockapi.io/api/v1/matches
   ```

3. Restart Vite after changing the environment variable.

The application sends `GET` to read the list, `POST` to create, `PUT /matches/:id` to update, and `DELETE /matches/:id` to delete records. Resource fields:

| Field                         | Type             | Description                 |
| ----------------------------- | ---------------- | --------------------------- |
| `opponent`                    | string           | Opponent name               |
| `competition`                 | string           | Competition                 |
| `date`                        | string           | Match date (`YYYY-MM-DD`)   |
| `time`                        | string           | Match time (`HH:mm`)        |
| `venue`                       | string           | Venue name                  |
| `status`                      | string           | `scheduled` or `played`     |
| `teamScore`, `opponentScore`  | number or null   | Team scores                 |
| `goals`, `assists`, `minutes` | number           | Personal performance stats  |

Win/draw/loss rates are calculated from the score instead of storing a result state that could disagree with the two team scores. Aggregate stats are filtered by the selected year; the chart allows selecting a month to filter the match list.

## Validation commands

```bash
npm run lint
npm run build
```
