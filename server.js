import app from './app.js'
import { DEV_PORT } from './config/config.js'


// **************************** database connection start ************* // 
import connectDB from './config/db.js';
connectDB()
// **************************** database connection end ************* // 

app.listen(DEV_PORT, () => {
  console.log(`Server running on port ${DEV_PORT}`);
});