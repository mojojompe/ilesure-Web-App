import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Store } from 'lucide-react';
import { agentStoreService } from '../../api/agentStore';
import { useAuth } from '../../api/authContext';

export function AgentStorePage() {
  const { user } = useAuth();
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const res: any = await agentStoreService.getStore();
      if (res.success) {
        setStoreData(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load store', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (productId: string) => {
    try {
      setBuying(productId);
      const res: any = await agentStoreService.buyProduct(productId);
      if (res.success) {
        showToast(res.message, 'success');
        fetchStoreData(); // refresh points
      } else {
        showToast(res.error?.message || 'Purchase failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Purchase failed', 'error');
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Toast notification overlay */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-status-success text-white' : 'bg-status-error text-white'
          }`}>
            <span>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-[#E1AD01]" />
            Agent Store
          </h1>
          <p className="text-gray-500 mt-1">Purchase credits, subscriptions, and boost your listings.</p>
        </div>
        
        {storeData?.points !== undefined && (
          <div className="bg-[#E1AD01]/10 px-4 py-2 rounded-xl border border-[#E1AD01]/20 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#E1AD01]" />
            <span className="font-bold text-[#E1AD01]">{storeData.points} Points Available</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {storeData?.products?.length > 0 ? (
          storeData.products.map((product: any) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{product.description}</p>
                <div className="text-2xl font-black text-gray-900 mb-6">
                  {product.price} <span className="text-base font-normal text-gray-500">points</span>
                </div>
              </div>
              <button
                disabled={buying === product.id}
                onClick={() => handleBuy(product.id)}
                className="w-full py-3 px-4 bg-[#1C0A00] text-white rounded-xl font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {buying === product.id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Purchase
                  </>
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            No products available in the store right now.
          </div>
        )}
      </div>
    </div>
  );
}
