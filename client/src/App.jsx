import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import { MotionConfig } from 'framer-motion'
import SiteExperience from './components/SiteExperience'

const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminProductVisitors = lazy(() => import('./pages/admin/AdminProductVisitors'))
const AdminProductForm = lazy(() => import('./pages/admin/AdminProductForm'))

function PageLoading() {
  return <div role="status" className="grid min-h-[60vh] place-items-center"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" /><p className="mt-4 text-sm text-brand-700">A little something good is loading…</p></div></div>
}

function StoreLayout({ children }) {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>
      <main key={pathname} id="main-content" className="route-content flex-1"><Suspense fallback={<PageLoading />}>{children}</Suspense></main>
      <Footer/>
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user"><AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <SiteExperience />
          <Suspense fallback={<PageLoading />}><Routes>
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
              <Route path="product-visitors" element={<AdminProductVisitors/>}/>
              <Route path="products/new" element={<AdminProductForm/>}/>
              <Route path="products/:productId/edit" element={<AdminProductForm/>}/>
            </Route>
          </Routes></Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider></MotionConfig>
  )
}
