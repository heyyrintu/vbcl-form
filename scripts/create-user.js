#!/usr/bin/env node

/**
 * Simple script to create a user for the VBCL Alwar Production Tracker
 * Usage: node scripts/create-user.js <username> <password>
 * Example: node scripts/create-user.js admin mypassword123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser(username, password) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.error(`❌ Error: User '${username}' already exists.`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    console.log(`✅ User created successfully!`);
    console.log(`   Username: ${user.username}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`\nYou can now log in with these credentials.`);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/create-user.js <username> <password>');
  console.error('Example: node scripts/create-user.js admin mypassword123');
  process.exit(1);
}

const [username, password] = args;

if (!username || !password) {
  console.error('❌ Error: Username and password are required.');
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌ Error: Password must be at least 6 characters long.');
  process.exit(1);
}

console.log(`Creating user '${username}'...`);
createUser(username, password);

