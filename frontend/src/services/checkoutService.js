import axios from '@/lib/axios';

export const checkoutService = {
    /**
     * @returns CheckoutResponse
     * @throws AxiosError với response.data.result chứa stockMismatches
     */
    checkout: async (checkoutData) => {
        const response = await axios.post('/orders/checkout', checkoutData);
        return response.data.result;
    },

    validateCart: async () => {
        const response = await axios.get('/cart/validate');
        return response.data.result;
    },
};