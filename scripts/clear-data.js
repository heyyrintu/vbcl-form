const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('Starting to clear data...');
    
    // Delete in order to respect foreign key constraints
    console.log('Deleting EmployeeAssignments...');
    await prisma.employeeAssignment.deleteMany({});
    
    console.log('Deleting Records...');
    await prisma.record.deleteMany({});
    
    console.log('Deleting EmployeeAttendance...');
    await prisma.employeeAttendance.deleteMany({});
    
    console.log('Deleting Employees...');
    await prisma.employee.deleteMany({});
    
    console.log('✅ All data cleared successfully (users preserved)!');
    console.log('Summary:');
    console.log('- Records: Deleted');
    console.log('- Employees: Deleted');
    console.log('- Attendance: Deleted');
    console.log('- Users: Preserved');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
