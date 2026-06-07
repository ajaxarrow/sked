import { runLampanusanNHSSeed } from '../server/database/lampanusan-nhs-seed.js'

runLampanusanNHSSeed()
  .then(() => { console.log('✓ Seed complete'); process.exit(0) })
  .catch((err) => { console.error('Seed failed:', err); process.exit(1) })
