import mongoose from 'mongoose';
import User from './src/entities/auth/auth.model.js';
import { mongoURI } from './src/core/config/config.js';

async function run() {
  const email = 'thesocialchambersg@gmail.com';
  const password = 'boss_65';
  try {
    if (!mongoURI) throw new Error('MONGO_URI is not set');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        firstName: 'Admin',
        lastName: 'User',
        email,
        password,
        role: 'ADMIN',
      });
      await user.save();
      console.log('✅ Admin user created:', user._id.toString());
    } else {
      user.password = password; // will be hashed by pre-save
      user.role = 'ADMIN';
      await user.save();
      console.log('✅ Existing user updated to ADMIN:', user._id.toString());
    }

    const verify = await User.findOne({ email }).lean();
    console.log('User role:', verify?.role);
  } catch (e) {
    console.error('❌ Failed to create/update admin:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();


