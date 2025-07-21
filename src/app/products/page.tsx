"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Product, findProductById } from "@/lib/mock-db";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isAdmin, isLoading, isUnauthenticated } = useCurrentUser(); // Gunakan hook
  const router = useRouter();
  const searchParams = useSearchParams(); // Dapatkan query params

  useEffect(() => {
    // Redirect jika bukan admin atau belum login
    if (!isLoading) {
      if (isUnauthenticated) {
        router.push("/auth/signin");
        return;
      }
      if (!isAdmin) {
        // Redirect non-admin ke dashboard atau halaman 403 (Forbidden)
        router.push("/dashboard"); // Atau router.push('/403-forbidden') jika ada
        return;
      }
    }
    fetchProducts();

    // Cek jika ada query param 'edit'
    const editProductId = searchParams.get('edit');
    if (editProductId) {
        const productToEdit = findProductById(editProductId);
        if (productToEdit) {
            handleEdit(productToEdit);
        } else {
            setError("Product not found for editing.");
        }
    }
  }, [isAdmin, isLoading, isUnauthenticated, router, searchParams]); // Tambahkan searchParams sebagai dependency

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data: Product[] = await res.json();
        setProducts(data);
      } else {
        setError("Failed to fetch products.");
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("An error occurred while fetching products.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
    };

    if (isNaN(productData.price) || productData.price <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    if (!productData.name || !productData.description || !productData.imageUrl) {
        setError("All fields (Name, Description, Price, Image URL) are required.");
        return;
    }

    try {
      const method = editingProduct ? "PUT" : "POST";
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        setMessage(`Product ${editingProduct ? "updated" : "added"} successfully!`);
        setFormData({ name: "", description: "", price: "", imageUrl: "" });
        setEditingProduct(null);
        setShowForm(false);
        fetchProducts();
        router.replace('/products'); // Hapus query param 'edit' dari URL
      } else {
        const data = await res.json();
        setError(data.message || `Failed to ${editingProduct ? "update" : "add"} product.`);
      }
    } catch (err) {
      console.error("Product form submit error:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    setMessage(null);
    setError(null);
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("Product deleted successfully!");
        fetchProducts();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Delete product error:", err);
      setError("An unexpected error occurred during deletion.");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", price: "", imageUrl: "" });
    setShowForm(false);
    router.replace('/products'); // Hapus query param 'edit' dari URL
  };

  // Tampilkan loading/redirect jika status belum jelas atau tidak admin
  if (isLoading || isUnauthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-10">Product Management</h1>

      {message && <p className="text-green-600 text-sm mb-4 text-center">{message}</p>}
      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <div className="mb-8 text-center">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingProduct(null);
            setFormData({ name: "", description: "", price: "", imageUrl: "" });
            router.replace('/products'); // Hapus query param 'edit' jika ada
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {showForm ? "Hide Form" : "Add New Product"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Product"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.price}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-bold mb-2">Image URL</label>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.imageUrl}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-center text-gray-600 text-xl">No products found. Add some!</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Current Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <Image src={product.imageUrl} alt={product.name} width={60} height={60} className="object-cover rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp{product.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}