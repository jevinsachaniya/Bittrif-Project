import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import MyOrders from './pages/MyOrders'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductForm from './pages/admin/AdminProductForm'

function StoreLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>
      <main className="flex-1">{children}</main>
      <Footer/>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Store */}
            <Route path="/"               element={<StoreLayout><Home/></StoreLayout>}/>
            <Route path="/products"       element={<StoreLayout><Products/></StoreLayout>}/>
            <Route path="/product/:id"    element={<StoreLayout><ProductDetail/></StoreLayout>}/>
            <Route path="/cart"           element={<StoreLayout><Cart/></StoreLayout>}/>
            <Route path="/checkout"       element={<StoreLayout><Checkout/></StoreLayout>}/>
            <Route path="/order-success/:id" element={<StoreLayout><OrderSuccess/></StoreLayout>}/>
            <Route path="/about"          element={<StoreLayout><About/></StoreLayout>}/>
            <Route path="/contact"        element={<StoreLayout><Contact/></StoreLayout>}/>
            {/* Auth */}
            <Route path="/auth"           element={<Navigate to="/login" replace />}/>
            <Route path="/login"          element={<Login/>}/>
            <Route path="/register"       element={<Register/>}/>
            {/* User */}
            <Route path="/my-orders"      element={<StoreLayout><MyOrders/></StoreLayout>}/>
            {/* Admin */}
            <Route path="/admin" element={<AdminLayout/>}>
              <Route index           element={<AdminDashboard/>}/>
              <Route path="orders"   element={<AdminOrders/>}/>
              <Route path="products" element={<AdminProducts/>}/>
              <Route path="products/new" element={<AdminProductForm/>}/>
              <Route path="products/:productId/edit" element={<AdminProductForm/>}/>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
