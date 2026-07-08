'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Plus, Bell, User, LogOut, Moon, Sun, Monitor, X, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

interface SearchResult {
  products: any[]
  suppliers: any[]
  purchaseOrders: any[]
  batches: any[]
  warehouses: any[]
  categories: any[]
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  is_read: boolean
  linked_entity_id?: string
  linked_entity_type?: string
}

/**
 * InventoryHeader - Global header for all Inventory pages
 * Features:
 * - Global Search across all entities
 * - Quick Add menu
 * - Notification Center
 * - Profile Menu with Theme & Logout
 */
export default function InventoryHeader() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1)

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Profile state
  const [showProfile, setShowProfile] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [user, setUser] = useState({ name: 'Admin User', email: 'admin@inventory.local', role: 'Administrator' })

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // Poll every minute
    return () => clearInterval(interval)
  }, [])

  // Handle search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch()
      } else {
        setSearchResults(null)
        setShowSearchDropdown(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async () => {
    try {
      setSearchLoading(true)
      const response = await fetch(`/api/inventory/search?q=${encodeURIComponent(searchQuery)}`)
      const data: SearchResult = await response.json()
      setSearchResults(data)
      setShowSearchDropdown(true)
      setSelectedSearchIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true)
      const response = await fetch('/api/inventory/notifications?limit=20')
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Notifications error:', error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/inventory/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      fetchNotifications()
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/inventory/notifications/read-all', {
        method: 'POST',
      })
      fetchNotifications()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleSearchResultClick = (entity: any, type: string) => {
    let href = ''
    switch (type) {
      case 'product':
        href = `/admin/inventory/products/${entity.uuid}`
        break
      case 'supplier':
        href = `/admin/inventory/suppliers`
        break
      case 'purchaseOrder':
        href = `/admin/inventory/purchase-orders/${entity.uuid}`
        break
      case 'batch':
        href = `/admin/inventory/batches/${entity.uuid}`
        break
      case 'warehouse':
        href = `/admin/inventory/warehouses`
        break
      case 'category':
        href = `/admin/inventory/categories`
        break
    }
    if (href) {
      router.push(href)
      setSearchQuery('')
      setShowSearchDropdown(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown || !searchResults) return

    const allResults = [
      ...searchResults.products.map(p => ({ ...p, type: 'product' })),
      ...searchResults.suppliers.map(s => ({ ...s, type: 'supplier' })),
      ...searchResults.purchaseOrders.map(po => ({ ...po, type: 'purchaseOrder' })),
      ...searchResults.batches.map(b => ({ ...b, type: 'batch' })),
      ...searchResults.warehouses.map(w => ({ ...w, type: 'warehouse' })),
      ...searchResults.categories.map(c => ({ ...c, type: 'category' })),
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSearchIndex(Math.min(selectedSearchIndex + 1, allResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSearchIndex(Math.max(selectedSearchIndex - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSearchIndex >= 0 && allResults[selectedSearchIndex]) {
          handleSearchResultClick(allResults[selectedSearchIndex], allResults[selectedSearchIndex].type)
        }
        break
      case 'Escape':
        setShowSearchDropdown(false)
        break
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('inventory-theme', newTheme)
    
    if (newTheme === 'system') {
      document.documentElement.classList.toggle(
        'dark',
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    } else if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleLogout = () => {
    router.push('/admin/login')
    toast.success('Logged out successfully')
  }

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative" ref={searchDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products, suppliers, POs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-600">
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800">
                        Products
                      </div>
                      {searchResults.products.map((product) => (
                        <button
                          key={product.uuid}
                          onClick={() => handleSearchResultClick(product, 'product')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm transition"
                        >
                          {product.product_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.suppliers.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800">
                        Suppliers
                      </div>
                      {searchResults.suppliers.map((supplier) => (
                        <button
                          key={supplier.uuid}
                          onClick={() => handleSearchResultClick(supplier, 'supplier')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm transition"
                        >
                          {supplier.company_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.purchaseOrders.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800">
                        Purchase Orders
                      </div>
                      {searchResults.purchaseOrders.map((po) => (
                        <button
                          key={po.uuid}
                          onClick={() => handleSearchResultClick(po, 'purchaseOrder')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm transition"
                        >
                          {po.po_number}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.warehouses.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800">
                        Warehouses
                      </div>
                      {searchResults.warehouses.map((warehouse) => (
                        <button
                          key={warehouse.uuid}
                          onClick={() => handleSearchResultClick(warehouse, 'warehouse')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm transition"
                        >
                          {warehouse.warehouse_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Quick Add */}
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300 transition">
              <Plus size={20} />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
              <Link href="/admin/inventory/products/create" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-slate-600">
                ➕ Product
              </Link>
              <Link href="/admin/inventory/categories" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-slate-600">
                ➕ Category
              </Link>
              <Link href="/admin/inventory/suppliers" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm border-b border-gray-200 dark:border-slate-600">
                ➕ Supplier
              </Link>
              <Link href="/admin/inventory/purchase-orders" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm">
                ➕ Purchase Order
              </Link>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300 transition relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                <div className="sticky top-0 bg-white dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 p-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notificationsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-slate-600">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-600 ${
                          !notif.is_read ? 'bg-blue-50 dark:bg-slate-600' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{notif.title}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{notif.message}</p>
                            <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-slate-500 rounded text-blue-600"
                            >
                              <Check size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-700 dark:text-gray-300 transition"
            >
              <User size={20} />
            </button>

            {/* Profile Menu */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 dark:border-slate-600">
                  <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{user.role}</p>
                </div>

                <div className="p-2 border-b border-gray-200 dark:border-slate-600">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 px-2 py-2">Theme</p>
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      theme === 'light' ? 'bg-blue-50 dark:bg-slate-600 text-blue-600' : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Sun size={16} /> Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      theme === 'dark' ? 'bg-blue-50 dark:bg-slate-600 text-blue-600' : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Moon size={16} /> Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      theme === 'system' ? 'bg-blue-50 dark:bg-slate-600 text-blue-600' : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Monitor size={16} /> System
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-600 flex items-center gap-2 border-t border-gray-200 dark:border-slate-600"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
