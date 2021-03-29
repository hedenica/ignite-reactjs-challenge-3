import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const currentCart = [...cart]

      const productExists = currentCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount

      const currentAmount = productExists ? productExists.amount : 0

      const desiredAmount = currentAmount + 1

      if (desiredAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      if (productExists) {
        productExists.amount++
 
      } else {
        const product = await api.get(`/products/${productId}`)

        currentCart.push({...product.data, amount: desiredAmount})
      }

      setCart(currentCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentCart = [...cart]

      const productExists = currentCart.find(product => product.id === productId)

      if (productExists) {
        const updatedCart = currentCart.filter(product => product.id !== productExists.id)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) { return; }

      const currentCart = [...cart]

      const stock = await api.get<Stock>(`/stock/${productId}`)

      const currentStock = stock.data.amount

      if (amount > currentStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 
      
      const productExists = currentCart.find(product => product.id === productId)

      if (productExists) {
        productExists.amount = amount
      } else {
        throw Error()
      }

      setCart(currentCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
