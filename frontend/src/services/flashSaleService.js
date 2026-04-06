import axios from '@/lib/axios';

export const getFlashSalesPaged = async (params) => {
    const response = await axios.get('/flash-sales', { params });
    return response.data;
};

export const getFlashSaleById = async (id) => {
    const response = await axios.get(`/flash-sales/${id}`);
    return response.data;
};

export const createFlashSale = async (data) => {
    const response = await axios.post('/flash-sales', data);
    return response.data;
};

export const updateFlashSale = async (id, data) => {
    const response = await axios.put(`/flash-sales/${id}`, data);
    return response.data;
};

export const deleteFlashSale = async (id) => {
    const response = await axios.delete(`/flash-sales/${id}`);
    return response.data;
};