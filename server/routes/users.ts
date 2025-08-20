import type { Request, Response } from "express";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import * as schema from "../../shared/schema";
import { isAuthenticated } from "../auth";
import { eq, and } from "drizzle-orm";

// Schema definitions
const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(8).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  role: z.enum(["admin", "contributor", "approver", "read-only"]).optional(),
});

const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "contributor", "approver", "read-only"]),
});

const userRouter = Router();

// Get all organization users
userRouter.get("/:orgId/users", isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orgId } = req.params;
    const userId = req.user.claims.sub;

    // Check if user has access to organization
    const [userAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, userId)
        )
      );

    if (!userAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get all users in the organization
    const usersData = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      username: schema.users.username,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      role: schema.organizationUsers.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .innerJoin(
      schema.organizationUsers,
      and(
        eq(schema.users.id, schema.organizationUsers.userId),
        eq(schema.organizationUsers.organizationId, orgId)
      )
    );
    
    // Transform the data to match frontend expectations
    const users = usersData.map(userData => ({
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: userData.createdAt?.toISOString() || new Date().toISOString(),
      },
      role: userData.role,
    }));
    
    console.log('Returning users:', users.length > 0 ? { count: users.length, sample: users[0] } : 'No users');
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      message: "Failed to fetch users",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create user
userRouter.post("/:orgId/users", isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orgId } = req.params;
    const adminId = req.user.claims.sub;

    // Check if user has admin role
    const [adminAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, adminId),
          eq(schema.organizationUsers.role, "admin")
        )
      );

    if (!adminAccess) {
      return res.status(403).json({ message: "Only admins can create users" });
    }

    // Validate input
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input data",
        errors: validation.error.errors 
      });
    }

    const validatedData = validation.data;

    // Check if user already exists
    const [existingUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, validatedData.email));

    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const [user] = await db.insert(schema.users)
      .values({
        username: validatedData.email.split("@")[0], // Generate username from email
        email: validatedData.email,
        passwordHash: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      })
      .returning();

    // Add user to organization
    await db.insert(schema.organizationUsers)
      .values({
        organizationId: orgId,
        userId: user.id,
        role: validatedData.role,
        invitedBy: adminId
      });

    res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: validatedData.role
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ 
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Update user
userRouter.put("/:orgId/users/:userId", isAuthenticated, async (req: Request, res: Response) => {
  if (!req.user?.claims) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId, userId } = req.params;
  const updatingUserId = req.user.claims.sub;

  try {
    // Check if user has access to organization
    const [userAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, updatingUserId)
        )
      );

    if (!userAccess) {
      return res.status(403).json({ message: "Access denied to this organization" });
    }

    // Get existing user
    const [existingUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if target user belongs to the organization
    const [targetUserOrgAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, userId)
        )
      );

    if (!targetUserOrgAccess) {
      return res.status(404).json({ message: "User not found in this organization" });
    }

    // Allow admins to update any user, or users to update themselves
    const isAdmin = userAccess.role === "admin";
    const isSelfUpdate = existingUser.id === updatingUserId;
    
    if (!isAdmin && !isSelfUpdate) {
      return res.status(403).json({ message: "Can only update your own profile or need admin privileges" });
    }

    // Validate input
    const validationResult = updateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid input data",
        errors: validationResult.error.errors 
      });
    }

    const validatedData = validationResult.data;
    console.log('Validated update data:', validatedData);

    // Prepare update data
    const updateData = {
      ...(validatedData.firstName !== undefined && { firstName: validatedData.firstName }),
      ...(validatedData.lastName !== undefined && { lastName: validatedData.lastName }),
      ...(validatedData.password && { 
        passwordHash: await bcrypt.hash(validatedData.password, 10) 
      })
    };

    // Update user
    await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, userId));

    // Update role in organization_users if role is provided and user is admin
    if (validatedData.role && isAdmin) {
      await db.update(schema.organizationUsers)
        .set({ role: validatedData.role })
        .where(
          and(
            eq(schema.organizationUsers.organizationId, orgId),
            eq(schema.organizationUsers.userId, userId)
          )
        );
      console.log('Updated user role to:', validatedData.role);
    }

    // Get updated user data
    const [updatedUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!updatedUser) {
      throw new Error("Failed to retrieve updated user data");
    }

    return res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ 
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Delete user from organization
userRouter.delete("/:orgId/users/:userId", isAuthenticated, async (req: Request, res: Response) => {
  if (!req.user?.claims) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orgId, userId } = req.params;
  const deletingUserId = req.user.claims.sub;

  try {
    // Check if user has admin access to organization
    const [userAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, deletingUserId)
        )
      );

    if (!userAccess || userAccess.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Check if target user belongs to the organization
    const [targetUserOrgAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, userId)
        )
      );

    if (!targetUserOrgAccess) {
      return res.status(404).json({ message: "User not found in this organization" });
    }

    // Prevent deleting yourself
    if (userId === deletingUserId) {
      return res.status(400).json({ message: "Cannot remove yourself from the organization" });
    }

    // Remove user from organization
    await db.delete(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, userId)
        )
      );

    return res.json({
      message: "User removed from organization successfully"
    });
  } catch (error) {
    console.error("Error removing user from organization:", error);
    return res.status(500).json({ 
      message: "Failed to remove user from organization",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Alias for invite endpoint (same as creating a user)
userRouter.post("/:orgId/users/invite", isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.claims) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orgId } = req.params;
    const adminId = req.user.claims.sub;

    // Check if user has admin role
    const [adminAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(
        and(
          eq(schema.organizationUsers.organizationId, orgId),
          eq(schema.organizationUsers.userId, adminId),
          eq(schema.organizationUsers.role, "admin")
        )
      );

    if (!adminAccess) {
      return res.status(403).json({ message: "Only admins can invite users" });
    }

    // Validate input
    const validation = createUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid input data",
        errors: validation.error.errors 
      });
    }

    const validatedData = validation.data;

    // Check if user already exists
    const [existingUser] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, validatedData.email));

    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const [user] = await db.insert(schema.users)
      .values({
        username: validatedData.email.split("@")[0], // Generate username from email
        email: validatedData.email,
        passwordHash: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      })
      .returning();

    // Add user to organization
    await db.insert(schema.organizationUsers)
      .values({
        organizationId: orgId,
        userId: user.id,
        role: validatedData.role,
        invitedBy: adminId
      });

    res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: validatedData.role,
      message: "User invited successfully"
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json({ 
      message: "Failed to invite user",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default userRouter;
