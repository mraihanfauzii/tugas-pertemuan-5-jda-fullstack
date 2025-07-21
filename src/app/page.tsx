import Image from "next/image";
import Link from "next/link";
import { mockProducts } from "@/lib/mock-db";

export default function HomePage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-10">Our Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transform transition-transform hover:scale-105">
            <Link href={`/products/${product.id}`}>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              />
            </Link>
            <div className="p-5">
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/products/${product.id}`} className="hover:text-blue-600">
                  {product.name}
                </Link>
              </h2>
              <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              <p className="text-blue-600 font-bold text-lg">
                Rp{product.price.toLocaleString('id-ID')}
              </p>
              <Link href={`/products/${product.id}`} className="mt-4 block text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}