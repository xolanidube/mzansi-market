import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: email },
        ],
        isActive: true,
      },
      include: {
        shop: true,
        wallet: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

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
        phone: (user as any).phone,
        picture: (user as any).picture,
        userType: (user as any).userType,
        isVerified: (user as any).isVerified,
        bio: (user as any).bio,
        location: (user as any).location,
        createdAt: user.createdAt.toISOString(),
        shop: user.shop ? {
          id: user.shop.id,
          name: user.shop.name,
          description: user.shop.description,
          logo: user.shop.logo,
          banner: user.shop.banner,
          address: user.shop.address,
          isVerified: user.shop.isVerified,
        } : null,
        wallet: user.wallet ? {
          id: user.wallet.id,
          balance: user.wallet.balance,
          currency: user.wallet.currency,
          updatedAt: user.wallet.updatedAt.toISOString(),
        } : null,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
