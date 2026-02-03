import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        shop: true,
        wallet: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
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
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, bio, location, picture } = body;

    // Update user
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(picture !== undefined && { picture }),
      },
      include: {
        shop: true,
        wallet: true,
      },
    });

    return NextResponse.json({
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
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
