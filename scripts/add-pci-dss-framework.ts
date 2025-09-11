import { db } from "../server/db";
import { frameworks } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addPCIDSSFramework() {
  console.log("Adding PCI DSS framework...");

  try {
    // Check if PCI DSS framework already exists
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.name, "PCI DSS"))
      .limit(1);

    if (existingFramework.length > 0) {
      console.log("PCI DSS framework already exists:", existingFramework[0]);
      return;
    }

    // Insert PCI DSS framework
    const [pciDssFramework] = await db
      .insert(frameworks)
      .values({
        name: "PCI DSS",
        version: "v4.0.1",
        description: "Payment Card Industry Data Security Standard - A set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment.",
      })
      .returning();

    console.log("Created PCI DSS framework:", pciDssFramework);
    console.log("PCI DSS framework added successfully!");

  } catch (error) {
    console.error("Error adding PCI DSS framework:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addPCIDSSFramework();
