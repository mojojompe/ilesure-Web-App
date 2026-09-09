import React, { useState, useEffect } from 'react';
import { ShoppingCart01Icon, Money01Icon, Store01Icon, PlusSignCircleIcon, StarIcon, PackageIcon } from '@hugeicons/react';
import { AppLayout } from '../../components/layout/AppLayout';
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
      const payload = res?.data || res;
      if (payload && (payload.products || payload.rewardPoints !== undefined || payload.points !== undefined)) {
        setStoreData(payload);
      } else {
        setStoreData({ points: 0, products: [] });
      }
    } catch (err: any) {
      console.error(err);
      setStoreData({ points: 0, products: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (productId: string) => {
    try {
      setBuying(productId);
      const res: any = await agentStoreService.buyProduct(productId);
      if (res.success || res.message === 'Purchase successful!') {
        showToast(res.message || 'Purchase successful!', 'success');
        fetchStoreData(); // refresh points
      } else {
        showToast(res.error?.message || res.message || 'Purchase failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Purchase failed', 'error');
    } finally {
      setBuying(null);
    }
  };

  const products = storeData?.products || [];
  const points = storeData?.rewardPoints !== undefined ? storeData.rewardPoints : (storeData?.points || 0);

  if (loading) {
    return (
      <AppLayout role="agent" title="Reward Store01Icon">
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="agent" title="Reward Store01Icon">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Store01Icon className="w-6 h-6 text-mustard" />
              Agent Store
            </h1>
            <p className="text-text-secondary mt-1">Upgrade your tier and buy extra listing slots with your reward points.</p>
          </div>
          
          <div className="bg-mustard-pale px-4 py-3 rounded-xl border border-mustard-light flex items-center gap-2 self-start sm:self-auto">
            <Money01Icon className="w-5 h-5 text-mustard-dark" />
            <span className="font-bold text-mustard-dark">{points} Points Available</span>
          </div>
        </div>

        <div className="mt-8">
          {products.length === 0 ? (
            <div className="bg-white rounded-clay p-12 text-center shadow-clay-sm border border-clay-border">
              <PackageIcon className="w-12 h-12 text-clay-icon mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <div key={product._id} className="bg-white rounded-clay overflow-hidden shadow-clay hover:shadow-clay-lg transition-all duration-300 border border-clay-border flex flex-col group">
                  <div className="bg-clay-bg-light p-6 flex flex-col items-center justify-center border-b border-clay-border relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-mustard/10 rounded-full blur-xl group-hover:bg-mustard/20 transition-all duration-500"></div>
                    {product.type === 'listing_slots' ? (
                      <PlusSignCircleIcon className="w-16 h-16 text-mustard mb-2 relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <StarIcon className="w-16 h-16 text-mustard mb-2 relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                    )}
                    <h3 className="text-lg font-bold text-text-primary text-center relative z-10">{product.name}</h3>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-text-secondary text-sm flex-1">{product.description}</p>
                    
                    <div className="mt-6 pt-6 border-t border-clay-border flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-tertiary uppercase font-bold tracking-wider">Cost</span>
                        <span className="text-xl font-bold text-burnt-brown flex items-center gap-1">
                          {product.pointsCost} <span className="text-sm font-medium text-burnt-brown/70">pts</span>
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleBuy(product._id)}
                        disabled={buying === product._id || points < product.pointsCost}
                        className={`px-6 py-2.5 rounded-pill font-bold shadow-sm transition-all flex items-center gap-2 ${
                          points < product.pointsCost
                            ? 'bg-clay-border text-text-tertiary cursor-not-allowed'
                            : 'bg-burnt-brown text-white hover:bg-burnt-brown-dark hover:shadow-md hover:-translate-y-0.5'
                        }`}
                      >
                        {buying === product._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Buy Now'
                        )}
                      </button>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
