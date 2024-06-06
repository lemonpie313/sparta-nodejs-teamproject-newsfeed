import axios from 'axios';

const apiRoot = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const getAllCompaniesApi = async () => {
  try {
    const { data } = await apiRoot.get('');
    return data;
  } catch (error) {
    throw error;
  }
};