# Water Station Management System - Node.js API

A complete Node.js/Express conversion of the Water Station Laravel application with MySQL database via Aiven cloud hosting.

## 📋 Features

- **User Management**: Registration, login, authentication with JWT
- **Order Processing**: Create, track, and manage water orders
- **Payment Integration**: PayMongo checkout and webhook handling
- **Delivery Management**: Assign and track deliveries
- **Inventory Management**: Track water product inventory
- **Admin Dashboard**: Reports and analytics
- **Real-time Search**: Global search functionality

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Aiven account with MySQL database

### Setup with Aiven MySQL

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd water_station_node_new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Aiven MySQL Database**
   - Create a new MySQL service in Aiven console
   - Get your connection details
   - Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```
   AIVEN_DB_HOST=your-aiven-host.a.aivencloud.com
   AIVEN_DB_PORT=21717
   AIVEN_DB_NAME=defaultdb
   AIVEN_DB_USER=avnadmin
   AIVEN_DB_PASSWORD=your-password
   JWT_SECRET=your-secret-key
   PAYMONGO_SECRET_KEY=your-paymongo-key
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Seed database (optional)**
   ```bash
   npm run seed
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── config/          # Configuration files (database, services)
├── controllers/     # Route controllers
├── models/          # Sequelize ORM models
├── routes/          # Express routes
├── services/        # Business logic (PayMongo, etc.)
├── middleware/      # Authentication, validation, error handling
├── utils/           # Helper functions
└── server.js        # Express app setup
database/
├── migrations/      # Database migrations
├── seeders.js       # Database seeders
└── runMigrations.js # Migration runner
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Orders
- `GET /orders` - Get user's orders
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order details

### Payments
- `GET /payments/:orderId/status` - Check payment status
- `POST /webhooks/paymongo` - PayMongo webhook (public)

### Delivery
- `GET /delivery/dashboard` - Delivery dashboard
- `GET /delivery/history` - Delivery history
- `PATCH /delivery/update/:id` - Update delivery status
- `PATCH /delivery/payment/:id` - Mark payment received

## 📦 Database Models

- **User** - Customer, delivery personnel, admin
- **Order** - Order details and status
- **OrderItem** - Line items in orders
- **Payment** - Payment records
- **Delivery** - Delivery assignments and tracking
- **DeliveryAssignment** - Personnel assignments
- **Inventory** - Product inventory
- **Address** - Customer addresses
- **Notification** - User notifications
- **PredictiveReport** - Analytics and reports
- **WaterProduct** - Product catalog

## 🌐 Hosting on Aiven

### MySQL Setup
1. Go to [Aiven Console](https://console.aiven.io)
2. Create a new MySQL service
3. Choose your region and plan
4. Get connection details from the service page
5. Add them to your `.env` file

### Deployment to Production

```bash
# Set production environment
export NODE_ENV=production

# Update .env with production database
# Then start the server
npm start
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure Aiven firewall allows your IP
- Check database credentials in `.env`
- Verify MySQL is accessible from your environment

### PayMongo Issues
- Verify API keys are correct in `.env`
- Check PayMongo webhook configuration
- Ensure webhook URL is publicly accessible

## 📝 Environment Variables

See `.env.example` for all available configuration options.

## 🤝 Contributing

1. Create a new branch for features/fixes
2. Commit changes with clear messages
3. Push to your fork
4. Create a Pull Request

## 📄 License

MIT License

## 📞 Support

For issues and questions, create an issue in the repository.

---

**Note**: Remember to:
- Never commit `.env` file to git
- Use strong JWT_SECRET in production
- Enable SSL/TLS for Aiven MySQL connection
- Set up appropriate firewall rules
- Monitor your Aiven service usage
