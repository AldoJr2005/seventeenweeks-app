import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { userProfiles } from "../shared/schema";
import { eq } from "drizzle-orm";

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function resetAccount() {
  const username = process.argv[2];
  
  if (!username) {
    console.error("Usage: tsx scripts/reset-account.ts <username>");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    console.log(`Looking for profile with username: ${username}...`);
    
    // Find the profile by username
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.username, username.toLowerCase())).limit(1);
    
    if (!profile) {
      console.log(`No profile found with username: ${username}`);
      await pool.end();
      process.exit(0);
    }

    console.log(`Found profile: ${profile.id} (${profile.name || profile.username})`);
    
    // Delete the profile (this should cascade delete the challenge due to foreign key)
    console.log("Deleting profile and associated data...");
    await db.delete(userProfiles).where(eq(userProfiles.id, profile.id));
    
    console.log(`✅ Successfully deleted account for username: ${username}`);
    console.log("The user can now go through the setup process again.");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error resetting account:", error);
    await pool.end();
    process.exit(1);
  }
}

resetAccount();

