import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { updateUser } from '@/lib/mock-db';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, password } = await req.json();
    const userId = session.user.id;

    // Periksa apakah ada data yang dikirim
    if (!name && !email && !password) {
      return NextResponse.json({ message: 'No data provided for update' }, { status: 400 });
    }

    const updatedData: { name?: string; email?: string; password?: string } = {};
    if (name !== undefined) updatedData.name = name;
    if (email !== undefined) updatedData.email = email;

    if (password) {
      if (password.length > 0 && password.length < 8) {
        return NextResponse.json({ message: 'New password must be at least 8 characters long' }, { status: 400 });
      }
      updatedData.password = await bcrypt.hash(password, 10);
    }
    
    // Panggil fungsi update dari database
    const updatedUser = updateUser(userId, updatedData);

    if (updatedUser) {
      // Penting: Kembalikan data user yang baru (tanpa password)
      const { password: _, ...userWithoutPassword } = updatedUser;
      return NextResponse.json(userWithoutPassword, { status: 200 });
    } else {
      // Ini terjadi jika updateUser mengembalikan null atau undefined
      return NextResponse.json({ message: 'Failed to update user. User not found or no changes made.' }, { status: 404 });
    }

  } catch (error) {
    console.error("Profile update API error:", error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}