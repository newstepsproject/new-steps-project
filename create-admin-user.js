// MongoDB script to create admin user in production cluster
// Connection: mongodb+srv://newstepsfit:pAGHNe3!BKCLdt6@prod-newsteps.kwlkjkp.mongodb.net/newsteps

// Admin user data
const adminUser = {
  email: "admin@newsteps.fit",
  password: "$2a$12$LQv3c1yqBwEHxPiNsdk/NO.g.wdscxiog4X09yd/lIvK/4H6DHgOm", // Pre-hashed: Admin123!
  firstName: "Admin",
  lastName: "User", 
  name: "Admin User",
  phone: "",
  role: "admin",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Insert admin user (database will be selected from connection string)
db.users.insertOne(adminUser);

print("✅ Admin user created successfully in production cluster!");
print("Email: admin@newsteps.fit");
print("Password: Admin123!");
print("Database: newsteps");
print("Cluster: prod-newsteps");
