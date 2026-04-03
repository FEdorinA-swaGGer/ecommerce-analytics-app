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

export const getOrders = async () => {
  const { data } = await api.get('/orders')
  return data
}

/**
 * Creates an order document in json-server. Server assigns `id`.
 * @param {{ date: string, total: number, status: string, source: string, items?: object[], itemsCount?: number }} payload
 * @returns {Promise<object>}
 */
export const createOrder = async (payload) => {
  const { data } = await api.post('/orders', payload)
  return data
}

export const getSessions = async () => {
  const { data } = await api.get('/sessions')
  return data
}
