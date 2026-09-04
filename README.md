# @superinstance/canon-recs

Recommend papers related to a topic or to a paper, by combining `claim()` and `ghost()` on the Live Canon.

```js
const { recommendByTopic, recommendByPaper } = require('@superinstance/canon-recs');

const r1 = await recommendByTopic('trust ladder', 5);
// {
//   topic: 'trust ladder',
//   source: { number: 477, title: 'F168 — The Trust Ladder...', f_number: 168, ... },
//   source_score: 366.8,
//   recommendations: [
//     { number: 471, title: 'F159 — Seven Novel Enhancements...', f_number: 159, similarity: 0.9992 },
//     ...
//   ]
// }

const r2 = await recommendByPaper(470, 5);
// {
//   source: { number: 470, title: 'F161 — Conservation Laws...', ... },
//   recommendations: [
//     { number: 468, title: 'F146 — Real MediaPipe Hands...', similarity: 0.9983 },
//     ...
//   ]
// }
```

## Self-test

```bash
npm test
```

## Source

https://github.com/SuperInstance/canon-recs

## License

MIT
