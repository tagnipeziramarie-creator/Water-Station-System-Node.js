# Dashboard Features - Water Station Management System

## Overview
Your water refilling and delivery management system now includes three comprehensive role-based dashboards with real-time data analytics and management capabilities.

---

## 🛒 CUSTOMER DASHBOARD
**URL**: `http://localhost:3000/customer-dashboard.html`

### Features:
- **Profile Information**
  - View personal details (name, email, phone, address, barangay)
  
- **Statistics Overview**
  - Total Orders placed
  - Pending Orders count
  - Completed Orders count
  - Total Money Spent

- **Active Orders Section**
  - Display of currently pending, confirmed, or in-transit orders
  - View delivery personnel assigned to orders
  - Real-time status updates
  - Contact information for delivery personnel

- **Recent Orders Section**
  - Last 5 orders with dates and amounts
  - Order status indicators
  - Quick reference for order history

- **Available Products Section**
  - Browse all available water products
  - View product prices and stock quantity
  - Place new orders directly from dashboard

### Status Badges:
- 🟡 **Pending** - Order awaiting confirmation
- 🔵 **Confirmed** - Order confirmed and being processed
- 🚚 **In Transit** - Order on the way for delivery
- ✅ **Completed** - Order successfully delivered

---

## 🚗 DELIVERY PERSONNEL DASHBOARD
**URL**: `http://localhost:3000/delivery-dashboard.html`

### Features:
- **Delivery Personnel Profile**
  - View name, email, and contact information
  
- **Performance Statistics**
  - Total Deliveries assigned
  - Completed Deliveries count
  - Pending Deliveries count
  - Currently In Transit count

- **Active Deliveries Section**
  - Detailed delivery cards with:
    - Delivery & Order IDs
    - Customer information (name, phone, address, barangay)
    - Current delivery status
    - Action buttons to update status or mark complete

- **Today's Deliveries Section**
  - All deliveries scheduled or assigned for today
  - Quick access to customer details
  - Priority view for daily route planning

- **Status Management**
  - Update delivery status via modal dialog
  - Available statuses:
    - 📋 Pending - Not yet started
    - 🚗 In Transit (Accepted) - Currently delivering
    - ✅ Completed - Successfully delivered
    - ❌ Failed - Unable to deliver
  
- **Quick Actions**
  - "Update Status" button for fine-grained control
  - "Mark Complete" button for quick completion

### Customer Information Display:
Each delivery card shows comprehensive customer details:
- Customer name and contact
- Delivery address and barangay
- Phone number for customer communication

---

## 📊 ADMIN DASHBOARD
**URL**: `http://localhost:3000/admin-dashboard.html`

### System-Wide Statistics:
- 👥 **Total Users** - All registered users in system
- 🛍️ **Total Orders** - Complete order count
- 💰 **Total Revenue** - All completed orders revenue
- 🚚 **Total Deliveries** - All deliveries processed
- ⏳ **Pending Orders** - Orders awaiting action
- ✅ **Completed Orders** - Successfully completed orders
- 📅 **Today's Orders** - Orders created today
- 👤 **Total Customers** - Active customer count

### Analytics & Visualizations:
- **Order Status Chart** - Doughnut chart showing:
  - Pending orders
  - Completed orders
  - Cancelled orders
  
- **Delivery Performance Chart** - Bar chart displaying:
  - Total deliveries
  - Successful deliveries
  - Success metrics

### Top Customers Report:
Table showing:
- Customer name and contact info
- Number of orders placed
- Total amount spent
- Sorted by order count (top performers first)

### Delivery Personnel Performance:
Comprehensive performance metrics:
- Personnel name, email, phone
- Total assignments
- Completed assignments
- Success rate percentage
- Sorted by assignment count

### Inventory Management:
- Product name and price
- Current stock quantity
- Visual indicators for:
  - 🟢 Normal stock
  - 🟡 Low stock (< 10 units)
  - 🔴 Out of stock (0 units)

### Recent Orders Log:
- Order ID and customer information
- Total amount
- Current status
- Order creation date
- Most recent orders displayed first
- Auto-refreshes every 30 seconds

### Auto-Refresh:
Dashboard automatically updates system data every 30 seconds for real-time insights.

---

## 🔐 Authentication

### Login Required:
All dashboards require authentication. Users are automatically redirected to login page if no valid token is found.

### Token Storage:
- Tokens are stored in browser's `localStorage`
- Automatically included in API requests via Authorization header
- Clear token on logout to return to login page

### Role-Based Access:
- **Customer Dashboard**: Only accessible to users with `customer` role
- **Delivery Dashboard**: Only accessible to users with `delivery` role
- **Admin Dashboard**: Only accessible to users with `admin` role

---

## 📱 API Endpoints Used

### Customer Dashboard API:
```
GET /dashboard/customer
Authorization: Bearer <token>
```
Returns: Customer info, statistics, active orders, recent orders, available products

### Delivery Dashboard API:
```
GET /dashboard/delivery
Authorization: Bearer <token>

PUT /dashboard/delivery/:deliveryId/status
Authorization: Bearer <token>
Body: { "status": "completed|pending|accepted|rejected" }
```
Returns: Delivery info, statistics, active deliveries, today's deliveries

### Admin Dashboard API:
```
GET /dashboard/admin
Authorization: Bearer <token>
```
Returns: System statistics, charts data, top customers, delivery performance, inventory, recent orders

---

## 🎨 Design Features

### Responsive Design:
- Mobile-friendly layouts
- Grid systems that adapt to screen size
- Touch-friendly buttons and controls

### Visual Hierarchy:
- Clear section organization
- Color-coded status badges
- Intuitive icon usage

### Color Schemes:
- **Customer Dashboard**: Purple gradient (667eea → 764ba2)
- **Delivery Dashboard**: Pink/Red gradient (f093fb → f5576c)
- **Admin Dashboard**: Purple gradient (667eea → 764ba2)

### Interactive Elements:
- Hover effects on cards and tables
- Modal dialogs for status updates
- Smooth transitions and animations
- Real-time error handling

---

## 📊 Data Display

### Statistics Cards:
- Large, easy-to-read numbers
- Descriptive labels
- Hover animation effects
- Icon indicators

### Tables:
- Clean, organized layout
- Alternating row colors for readability
- Status badges for quick identification
- Responsive on mobile devices

### Charts (Admin Only):
- Doughnut charts for status distribution
- Bar charts for comparative analysis
- Chart.js library for rendering
- Auto-scaling based on data

---

## ⚙️ Features Summary by Role

| Feature | Customer | Delivery | Admin |
|---------|----------|----------|-------|
| View Profile | ✅ | ✅ | - |
| View Orders | ✅ | - | ✅ |
| Track Deliveries | ✅ | ✅ | ✅ |
| Update Delivery Status | - | ✅ | - |
| Browse Products | ✅ | - | - |
| View System Statistics | - | - | ✅ |
| View Top Customers | - | - | ✅ |
| Manage Inventory | - | - | ✅ |
| View Analytics Charts | - | - | ✅ |

---

## 🚀 Getting Started

### Step 1: Access Dashboard
1. Login to your account with your credentials
2. Role-appropriate dashboard loads automatically
3. Or access directly via URL (authentication required)

### Step 2: Navigate Features
- Use main navigation sections to access different views
- Scroll through tables for comprehensive data
- Click action buttons to perform operations

### Step 3: Perform Actions
- **Customers**: Browse products and track orders
- **Delivery Personnel**: Update delivery statuses and view route
- **Admins**: Monitor system performance and manage inventory

---

## 🛠️ Technical Details

### Backend Implementation:
- **Controller**: `src/controllers/dashboardController.js`
- **Routes**: `src/routes/dashboardRoutes.js`
- **Models**: Sequelize ORM with MySQL database
- **Authentication**: JWT token validation

### Frontend Implementation:
- **HTML**: Semantic markup
- **CSS**: Responsive grid layouts
- **JavaScript**: Fetch API for data retrieval
- **Charts**: Chart.js library integration

### Database Queries:
- Optimized aggregation functions
- Proper indexing on foreign keys
- Efficient data grouping and counting
- Real-time calculations

---

## 📝 Notes

- All timestamps display in browser's local timezone
- Currency values are formatted to PHP (₱)
- Auto-refresh intervals (Admin: 30 seconds)
- Offline detection and error handling
- Session timeout with graceful re-authentication

---

## 📞 Support

For issues or questions about the dashboards:
1. Check browser console for error messages
2. Verify authentication token is valid
3. Ensure database connection is active
4. Review API endpoint responses in Network tab

---

**Last Updated**: April 30, 2026
**Version**: 1.0.0
