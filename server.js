import app from './app.js'
import { PORT } from './config/config.js'


// **************************** database connection start ************* // 
import connectDB from './config/db.js';
connectDB()
// **************************** database connection end ************* // 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});