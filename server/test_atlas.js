import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Connecting to MongoDB Atlas...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => { 
    console.log('✅ Connected successfully to Atlas!'); 
    process.exit(0); 
  })
  .catch(e => { 
    console.error('❌ Connection failed:', e.message); 
    process.exit(1); 
  });
