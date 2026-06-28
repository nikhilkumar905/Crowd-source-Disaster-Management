import mongoose from 'mongoose';
console.log('Connecting...');
mongoose.connect('mongodb://127.0.0.1:27017/ldarcp')
  .then(() => { console.log('Connected!'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
