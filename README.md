# 🏦 Golden Nest VSLA Backend API

A robust backend API for Village Savings and Loan Association (VSLA) management system built with Node.js, Express.js, and MySQL.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Group Management**: Create and manage VSLA groups
- **Contributions**: Track member savings and contributions
- **Loan Management**: Loan applications, approvals, and repayments
- **Reports**: Financial summaries and group analytics
- **Security**: JWT authentication, input validation, and secure password handling

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8 or higher)
- **npm** or **yarn**

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mugabe-rob/cooperative-savings.git
   cd vsla-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials and JWT secret.

4. **Database setup**
   - Create MySQL database using the SQL file in `database/workbench_compatible.sql`
   - Import the file into MySQL Workbench or run via command line

5. **Start the server**
   ```bash
   npm run dev        # Development mode
   npm start          # Production mode
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group

### Contributions
- `GET /api/contributions` - Get all contributions
- `POST /api/contributions` - Record new contribution
- `GET /api/contributions/group/:groupId` - Get group contributions

### Loans
- `GET /api/loans` - Get all loans
- `POST /api/loans` - Apply for loan
- `POST /api/loans/:id/repay` - Record loan repayment

### Reports
- `GET /api/reports/summary` - Get financial summary
- `GET /api/reports/group/:groupId` - Get group report

## 📁 Project Structure

```
vsla-backend/
├── src/
│   ├── app.js              # Main application file
│   ├── config/
│   │   ├── database.js     # Database configuration
│   │   └── dotenv.js       # Environment configuration
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── database/
│   └── workbench_compatible.sql  # Database schema
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
└── README.md             # Project documentation
```

## 🔧 Environment Variables

```env
PORT=5000
NODE_ENV=development
DB_NAME=savings_app
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
JWT_SECRET=your_jwt_secret
```

## 🗄️ Database Schema

The database includes the following main tables:
- **Users** - User accounts and authentication
- **Groups** - VSLA group information
- **UserGroups** - Many-to-many relationship between users and groups
- **Contributions** - Member savings records
- **Loans** - Loan applications and tracking
- **Repayments** - Loan repayment records

## 🛡️ Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet.js
- Environment-based configuration

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for your domain

## 📊 API Response Format

All API responses follow this standard format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {
    // Response data
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Robert Mugabe**
- GitHub: [@mugabe-rob](https://github.com/mugabe-rob)
- Email: mugaberoberto007@gmail.com

## 🙏 Acknowledgments

- Built for Rwanda's VSLA community
- Inspired by cooperative financial systems
- Thanks to all contributors and testers

---

**Golden Nest VSLA** - Empowering communities through cooperative savings 🏦✨
