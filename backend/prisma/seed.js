const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const argon2 = require('argon2');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  // User permissions
  { name: 'View Users', resource: 'users', action: 'read' },
  { name: 'Create Users', resource: 'users', action: 'create' },
  { name: 'Update Users', resource: 'users', action: 'update' },
  { name: 'Delete Users', resource: 'users', action: 'delete' },

  // Case management
  { name: 'View Cases', resource: 'cases', action: 'read' },
  { name: 'Create Cases', resource: 'cases', action: 'create' },
  { name: 'Import Cases', resource: 'cases', action: 'import' },
  { name: 'Reset Cases', resource: 'cases', action: 'reset' },
  
  // Field Feedback
  { name: 'Submit Feedback', resource: 'feedback', action: 'create' },
  { name: 'View Feedback', resource: 'feedback', action: 'read' },
  { name: 'Audit Feedback', resource: 'feedback', action: 'audit' },

  // Role permissions
  { name: 'View Roles', resource: 'roles', action: 'read' },
  { name: 'Manage Roles', resource: 'roles', action: 'manage' },

  // Audit permissions
  { name: 'View Audit Logs', resource: 'audit', action: 'read' },
  { name: 'Manage Audit', resource: 'audit', action: 'manage' },

  // Blog permissions
  { name: 'Create Blog', resource: 'blog', action: 'create' },
  { name: 'Read Blog', resource: 'blog', action: 'read' },

  // Payout permissions
  { name: 'View Payouts', resource: 'payout', action: 'read' },
  { name: 'Manage Payouts', resource: 'payout', action: 'manage' },
];

const ROLES = [
  {
    name: 'super_admin',
    description: 'Full system access',
    isDefault: false,
    permissions: ['users:read', 'users:create', 'users:update', 'users:delete', 'cases:read', 'cases:create', 'cases:import', 'feedback:read', 'feedback:audit', 'roles:read', 'roles:manage', 'audit:read', 'audit:manage', 'blog:create', 'blog:read', 'payout:read', 'payout:manage'],
  },
  {
    name: 'admin',
    description: 'Administrator',
    isDefault: false,
    permissions: ['users:read', 'cases:read', 'feedback:read', 'feedback:audit', 'blog:read', 'payout:read'],
  },
  {
    name: 'supervisor',
    description: 'Manages cases and audits visits',
    isDefault: false,
    permissions: ['cases:read', 'feedback:read', 'feedback:audit', 'audit:read'],
  },
  {
    name: 'executive',
    description: 'Field executive - case feedback',
    isDefault: false,
    permissions: ['cases:read', 'feedback:create', 'blog:read', 'blog:create'],
  },
  {
    name: 'manager',
    description: 'Manager - payout management',
    isDefault: false,
    permissions: ['cases:read', 'payout:read', 'payout:manage', 'blog:read'],
  },
  {
    name: 'analyst',
    description: 'Analytics and reporting',
    isDefault: false,
    permissions: ['cases:read', 'audit:read', 'blog:read'],
  },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create permissions
    console.log('Creating permissions...');
    const createdPermissions = {};

    for (const perm of PERMISSIONS) {
      const permission = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: { name: perm.name },
        create: perm,
      });
      createdPermissions[`${perm.resource}:${perm.action}`] = permission.id;
      console.log(`  ✓ ${perm.name}`);
    }

    // Create roles
    console.log('\nCreating roles...');

    const createdRoles = {};
    for (const roleData of ROLES) {
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: { description: roleData.description },
        create: {
          name: roleData.name,
          description: roleData.description,
          isDefault: roleData.isDefault,
        },
      });
      createdRoles[roleData.name] = role.id;

      // Assign permissions to role
      for (const permKey of roleData.permissions) {
        const permissionId = createdPermissions[permKey];
        if (permissionId) {
          try {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId,
              },
            });
          } catch (err) {
            // Skip if already exists
          }
        }
      }

      console.log(`  ✓ ${roleData.name}`);
    }

    // Create super_admin user
    console.log('\nCreating super_admin user...');
    
    const hashedPassword = await argon2.hash('Admin@123');
    const superAdminUser = await prisma.user.upsert({
      where: { email: 'admin@authx.com' },
      update: { isActive: true },
      create: {
        email: 'admin@authx.com',
        username: 'admin',
        phone: '9000000001',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isVerified: true,
        isActive: true,
      },
    });

    // Assign super_admin role
    try {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: superAdminUser.id,
            roleId: createdRoles['super_admin'],
          },
        },
        update: {},
        create: {
          userId: superAdminUser.id,
          roleId: createdRoles['super_admin'],
        },
      });
    } catch (err) {
      // Role already assigned
    }

    console.log(`  ✓ admin@authx.com (super_admin)`);

    console.log('\n✅ Database seeding completed!\n');
    console.log('🔐 Super Admin Credentials:');
    console.log('  Email:    admin@authx.com');
    console.log('  Password: Admin@123\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();