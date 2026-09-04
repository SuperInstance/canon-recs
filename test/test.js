const { recommendByTopic, recommendByPaper, DEFAULT_BASE } = require('../index.js');

async function run() {
  console.log('canon-recs self-test');
  console.log('  base:', DEFAULT_BASE);

  // recommendByTopic
  const r1 = await recommendByTopic('trust ladder', 5);
  console.log('  recommend(trust ladder):');
  console.log('    source:', r1.source?.title?.slice(0, 50) || 'none');
  console.log('    recs:', r1.recommendations.length);
  for (const r of r1.recommendations.slice(0, 3)) {
    console.log('      - F' + r.f_number, r.title.slice(0, 40), '(sim=' + r.similarity + ')');
  }
  if (r1.recommendations.length < 5) throw new Error('expected 5 recs');

  // recommendByPaper
  const r2 = await recommendByPaper(470, 5);
  console.log('  recommend(paper 470):');
  console.log('    source:', r2.source?.title?.slice(0, 50) || 'none');
  for (const r of r2.recommendations.slice(0, 3)) {
    console.log('      - F' + r.f_number, r.title.slice(0, 40), '(sim=' + r.similarity + ')');
  }
  if (r2.recommendations.length < 5) throw new Error('expected 5 recs');

  console.log('  ✓ all checks passed');
}

run().catch(err => {
  console.error('  ✗ test failed:', err.message);
  process.exit(1);
});
