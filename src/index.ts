import app from './app'
import { PORT } from './config/env'

export default app

if (require.main === module) {
  app.listen(PORT, () => console.log(`SellMatic webhook running on port ${PORT}`))
}
