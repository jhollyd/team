interface product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
}

interface ProductPageProps {
    product: product;
}

const ProductPage = ({ product }: ProductPageProps) => {
    return (
        <div className="max-w-6xl mx-auto p-12 mt-12">
            <div className="flex flex-wrap justify-center mb-12">
                <div className="w-full lg:w-2/3 xl:w-3/4 mb-4 lg:mb-0">
                <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-2xl w-full h-auto object-contain mb-4"
                />
                </div>
                <div className="w-full lg:w-1/3 xl:w-1/4">
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <p className="text-lg font-medium mb-4">${product.price.toFixed(2)}</p>
                <p className="text-lg font-medium mb-8">{product.category}</p>
                <button className="bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                    Add to Cart
                </button>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;