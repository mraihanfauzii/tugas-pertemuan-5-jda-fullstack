import { NextRequest, NextResponse } from 'next/server';
import { findProductById, updateProduct, deleteProduct, Product } from '@/lib/mock-db';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";

// GET: Mengambil satu produk berdasarkan ID (Bisa diakses siapa saja)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const product = findProductById(id);

  if (!product) {
    return NextResponse.json({
      status: 'error',
      message: 'Product not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    status: 'success',
    message: 'Product fetched successfully',
    data: product
  }, { status: 200 });
}

// PUT: Mengupdate produk berdasarkan ID (Hanya Admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({
      status: 'error',
      message: 'Unauthorized. Admin access required.'
    }, { status: 403 });
  }

  const { id } = params;
  try {
    const updatedData: Partial<Product> = await req.json();

    if (Object.keys(updatedData).length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'No data provided for update'
      }, { status: 400 });
    }
    // Validasi harga
    if (updatedData.price !== undefined && (typeof updatedData.price !== 'number' || updatedData.price <= 0)) {
        return NextResponse.json({
          status: 'error',
          message: 'Price must be a positive number'
        }, { status: 400 });
    }

    const updatedProduct = updateProduct(id, updatedData);

    if (!updatedProduct) {
      return NextResponse.json({
        status: 'error',
        message: 'Product not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Product updated successfully',
      data: updatedProduct
    }, { status: 200 });
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}

// DELETE: Menghapus produk berdasarkan ID (Hanya Admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({
      status: 'error',
      message: 'Unauthorized. Admin access required.'
    }, { status: 403 });
  }

  const { id } = params;
  const isDeleted = deleteProduct(id);

  if (!isDeleted) {
    return NextResponse.json({
      status: 'error',
      message: 'Product not found'
    }, { status: 404 });
  }

  return NextResponse.json({
    status: 'success',
    message: 'Product deleted successfully'
  }, { status: 200 });
}