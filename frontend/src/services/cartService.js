// frontend/src/services/cartService.js
import axios from '@/lib/axios';

const BASE = '/cart';

export const cartService = {
    getCart: () => axios.get(BASE).then(r => r.data.result),

    addItem: (skuId, quantity = 1) =>
        axios.post(`${BASE}/items`, { skuId, quantity }).then(r => r.data.result),

    updateItem: (skuId, quantity) =>
        axios.put(`${BASE}/items`, { skuId, quantity }).then(r => r.data.result),

    removeItem: (skuId) =>
        axios.delete(`${BASE}/items/${skuId}`).then(r => r.data),

    clearCart: () =>
        axios.delete(BASE).then(r => r.data),

    // Guest
    getGuestCart: (sessionId) =>
        axios.get(`${BASE}/guest/${sessionId}`).then(r => r.data.result),

    addToGuestCart: (sessionId, skuId, quantity = 1) =>
        axios.post(`${BASE}/guest/${sessionId}/items`, { skuId, quantity }).then(r => r.data.result),

    // Merge khi login
    mergeCart: (sessionId) =>
        axios.post(`${BASE}/merge?sessionId=${sessionId}`).then(r => r.data.result),
};