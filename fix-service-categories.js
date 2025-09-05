import mongoose from 'mongoose';
import Service from './src/entities/admin/Services/createServices.model.js';
import Category from './src/entities/category/category.model.js';
import { mongoURI } from './src/core/config/config.js';

async function fixServiceCategories() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get current categories
    const packagesCategory = await Category.findOne({ name: "Packages" });
    const hourlyCategory = await Category.findOne({ name: "Hourly" });

    console.log('Current Categories:');
    console.log(`Packages ID: ${packagesCategory._id}`);
    console.log(`Hourly ID: ${hourlyCategory._id}`);

    // Get all services
    const services = await Service.find();
    console.log(`\nFound ${services.length} services to update`);

    let packagesUpdated = 0;
    let hourlyUpdated = 0;

    for (const service of services) {
      let newCategoryId = null;
      
      // Determine which category this service should belong to based on its name
      const serviceName = service.name.toLowerCase();
      
      if (serviceName.includes('package') || serviceName.includes('day pass') || serviceName.includes('noon pass')) {
        // This is a package service
        newCategoryId = packagesCategory._id;
        packagesUpdated++;
        console.log(`📦 "${service.name}" → Packages`);
      } else {
        // This is an hourly service  
        newCategoryId = hourlyCategory._id;
        hourlyUpdated++;
        console.log(`⏰ "${service.name}" → Hourly`);
      }

      // Update the service
      await Service.findByIdAndUpdate(service._id, { category: newCategoryId });
    }

    console.log(`\n✅ Update Complete:`);
    console.log(`   📦 ${packagesUpdated} services moved to Packages`);
    console.log(`   ⏰ ${hourlyUpdated} services moved to Hourly`);

    // Verify the updates
    console.log('\n=== VERIFICATION ===');
    const packagesServices = await Service.find({ category: packagesCategory._id });
    const hourlyServices = await Service.find({ category: hourlyCategory._id });
    
    console.log(`Packages category now has ${packagesServices.length} services`);
    console.log(`Hourly category now has ${hourlyServices.length} services`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixServiceCategories();
