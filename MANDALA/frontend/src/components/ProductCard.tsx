interface product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
}

interface ProductCardProps {
    product: product;
}


const ProductCard: React.FC<ProductCardProps> = ( { product} ) => {
  return (
    <div>
      <div key={product.id} 
        className="border rounded-lg shadow hover:shadow-md transition overflow-hidden">
        <img
            src={product.image}
            alt={product.name}
            className="w-full h-60 object-cover"
        />
        <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800">
                {product.name}
            </h2>
            <p className="text-blue-600 font-bold mt-1">${product.price.toFixed(2)}</p>
            </div>
        </div>
    </div>
  );
};

export default ProductCard;