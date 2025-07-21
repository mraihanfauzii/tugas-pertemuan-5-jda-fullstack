import { NextRequest, NextResponse } from 'next/server';
import { addUser, findUserByEmail } from '@/lib/mock-db';
import bcrypt from 'bcryptjs'; // Impor bcryptjs

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    // Validasi panjang password
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Periksa apakah email sudah terdaftar
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 }); // Conflict
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10

    // Tambahkan user baru dengan password yang sudah di-hash
    const newUser = addUser({ name, email, password: hashedPassword });

    // Tidak mengirim password kembali dalam respons
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ message: 'Registration successful', user: userWithoutPassword }, { status: 201 }); // Created
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}