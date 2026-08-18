import { apiClient } from './client';

export const agentStoreService = {
  getStore: async () => {
    const response = await apiClient.get('/agents/store');
    return response.data;
  },
  buyProduct: async (productId: string) => {
    const response = await apiClient.post('/agents/store/buy', { productId });
    return response.data;
  }
};
