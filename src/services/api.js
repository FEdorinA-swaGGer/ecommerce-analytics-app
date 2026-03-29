import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

export const getProducts = async () => {
  const { data } = await api.get('/products')
  return data
}

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`)
  return data
}

export const createProduct = async (payload) => {
  const { data } = await api.post('/products', payload)
  return data
}

export const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload)
  return data
}

export const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`)
}
