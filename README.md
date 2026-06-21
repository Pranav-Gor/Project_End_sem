# Auction Management System

A full-stack real-time Auction Management Platform built using the MERN Stack. The system enables users to participate in live auctions, place bids in real-time, manage wallets, and securely perform transactions through Razorpay integration.

## Features

* Real-time bidding using WebSockets
* Secure JWT-based Authentication & Authorization
* User Registration and Login
* Auction Creation and Management
* Live Bid Tracking and Validation
* Digital Wallet System
* Razorpay Payment Gateway Integration
* Role-Based Access Control (Admin, Seller, Bidder)
* Responsive User Interface
* RESTful API Architecture
* CI/CD Pipeline using GitHub Actions
* Automated Code Quality and Test Validation

## Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication

### Database

* MongoDB

### DevOps & Tools

* Git
* GitHub Actions
* Docker
* Postman

### Payment Integration

* Razorpay

## Project Structure

```text
.
├── backend
├── src
├── document
├── public
├── package.json
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/Pranav-Gor/Auction_Management_Sem2_Mern.git
cd Auction_Management_Sem2_Mern
```

### Install Dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file inside the backend directory and configure the following:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Running the Project

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
npm run dev
```

## Important Note

The `node_modules` directory is intentionally excluded from the repository using `.gitignore`.

After cloning the project, install dependencies manually:

```bash
npm install
cd backend
npm install
```

## Academic Project

This project was developed as an End Semester MCA Project to demonstrate:

* Full Stack Development
* Real-Time Communication using WebSockets
* Payment Gateway Integration
* Secure Authentication Mechanisms
* CI/CD Implementation
* Cloud and DevOps Best Practices

## Author

**Pranav Gor**

Master of Computer Applications (MCA)
Dharmsinh Desai University

GitHub: https://github.com/Pranav-Gor
