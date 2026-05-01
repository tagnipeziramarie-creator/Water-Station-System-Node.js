# Water Station Node.js API - Aiven Hosting Setup Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Aiven account (https://aiven.io)
- GitHub account for version control

## Step 1: Aiven MySQL Database Setup

### 1. Create MySQL Service on Aiven

1. Log in to [Aiven Console](https://console.aiven.io)
2. Click **Create a new service**
3. Select **MySQL** from the list
4. Choose your preferred region (recommend closest to your location)
5. Select plan (Start plan is good for development)
6. Name your service (e.g., `water-station-db`)
7. Click **Create service**

### 2. Get Connection Details

Once service is created:
1. Go to service page
2. Copy connection information:
   - **Host**: `your-service-name.a.aivencloud.com`
   - **Port**: Usually `21717` for MySQL
   - **Username**: `avnadmin` (default)
   - **Password**: Auto-generated, shown in Connection details
   - **Database**: `defaultdb`

### 3. Set Up Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd water_station_node_new

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your Aiven credentials
nano .env
```

Update `.env`:
```
AIVEN_DB_HOST=your-service.a.aivencloud.com
AIVEN_DB_PORT=21717
AIVEN_DB_NAME=defaultdb
AIVEN_DB_USER=avnadmin
AIVEN_DB_PASSWORD=your-aiven-password
JWT_SECRET=your-strong-jwt-secret
PAYMONGO_SECRET_KEY=your-paymongo-key
```

## Step 2: Database Migrations

```bash
# Run migrations to create tables
npm run migrate

# Seed database with sample data (optional)
npm run seed
```

## Step 3: GitHub Setup

### 1. Initialize Git Repository

```bash
# If not already a git repo
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Water Station Node.js API"
```

### 2. Push to GitHub

```bash
# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/water_station_node_new.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3. Set GitHub Secrets (for CI/CD)

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `AIVEN_DB_HOST`
   - `AIVEN_DB_USER`
   - `AIVEN_DB_PASSWORD`
   - `JWT_SECRET`

## Step 4: Running the Application

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Production

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Start server
npm start
```

## Step 5: Aiven App Platform Deployment (Optional)

### Deploy to Aiven App Platform

1. **Containerize the app**
   ```dockerfile
   # Create Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Push to Aiven Container Registry**
   ```bash
   docker build -t water-station-api .
   docker tag water-station-api:latest your-aiven-registry/water-station-api:latest
   docker push your-aiven-registry/water-station-api:latest
   ```

3. **Deploy via Aiven Console**
   - Go to App Platform service
   - Create new app
   - Configure environment variables
   - Deploy from container image

## Database Schema

The application uses the following tables (auto-created via migrations):
- `users` - User accounts and authentication
- `orders` - Customer orders
- `order_items` - Line items in orders
- `payments` - Payment records (PayMongo integration)
- `deliveries` - Delivery tracking
- `delivery_assignments` - Assign personnel to deliveries
- `inventories` - Product inventory
- `addresses` - Customer addresses
- `notifications` - User notifications
- `water_products` - Product catalog
- `predictive_reports` - Analytics and reports

## Monitoring on Aiven

### Check Database Status

1. Aiven Console → Your MySQL Service
2. View metrics: Connections, CPU, Memory, Disk usage
3. Set up alerts for thresholds

### Backup Configuration

1. Service page → Settings
2. Enable automatic backups (default: daily)
3. Backups are retained for 30 days

## Firewall Configuration

### Allow Your Application

1. MySQL Service → Connection info
2. Click IP whitelist
3. Add your application server IP address
4. Recommended: Use VPC peering for better security

## Troubleshooting

### Connection Issues

```bash
# Test connection
mysql -h your-host.a.aivencloud.com -u avnadmin -p -P 21717

# Connection refused?
# - Check IP whitelist in Aiven console
# - Verify credentials in .env
# - Ensure MySQL service is running
```

### SSL/TLS Connection

If you get SSL errors, update `.env`:
```
AIVEN_DB_SSL=Amazon RDS
```

## Cost Optimization

- **Start Plan**: ~$25/month for development
- **Business Plan**: ~$95/month for production
- Includes: 160 GB storage, 2 vCPU, high availability
- Monitor usage in Aiven Console billing section

## Security Best Practices

1. ✅ Never commit `.env` to git (already in `.gitignore`)
2. ✅ Use strong JWT_SECRET (minimum 32 characters)
3. ✅ Enable SSL for database connections
4. ✅ Set up firewall rules (IP whitelist)
5. ✅ Rotate database password regularly
6. ✅ Use environment variables for secrets
7. ✅ Enable backups for data protection

## Support

- Aiven Docs: https://docs.aiven.io
- MySQL Documentation: https://dev.mysql.com/doc
- Node.js Express: https://expressjs.com
- Sequelize ORM: https://sequelize.org

---

For more help, check the main [README.md](README.md)
