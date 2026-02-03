import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { generateUniqueKey } from "@/lib/utils";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, userType = "CLIENT" } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique key
    const uniqueKey = generateUniqueKey();

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        userType: userType === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "CLIENT",
        uniqueKey,
        isActive: true,
        isVerified: false,
      },
    });

    // Create wallet for new user
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
        currency: "ZAR",
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        userType: user.userType,
        uniqueKey: user.uniqueKey,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    // Return user data and tokens
    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        phone: user.phone,
        picture: user.picture,
        userType: user.userType,
        isVerified: user.isVerified,
        bio: user.bio,
        location: user.location,
        createdAt: user.createdAt.toISOString(),
        shop: null,
        wallet: {
          id: user.id,
          balance: 0,
          currency: "ZAR",
          updatedAt: new Date().toISOString(),
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Mobile register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
