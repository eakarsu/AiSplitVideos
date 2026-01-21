#!/bin/bash

# AI Split Videos - Startup Script
# This script will:
# 1. Clean up used ports (3000, 3001)
# 2. Set up PostgreSQL database
# 3. Run migrations
# 4. Seed data with 15+ items per feature
# 5. Start backend and frontend servers

set -e

echo "=========================================="
echo "   AI Split Videos - Startup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process on a specific port
kill_port() {
    local port=$1
    print_status "Checking port $port..."

    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local pid=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$pid" ]; then
            print_warning "Killing process on port $port (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi
    # For Linux
    else
        local pid=$(fuser $port/tcp 2>/dev/null)
        if [ -n "$pid" ]; then
            print_warning "Killing process on port $port (PID: $pid)"
            fuser -k $port/tcp 2>/dev/null || true
            sleep 1
        fi
    fi
    print_success "Port $port is now available"
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    print_status "Waiting for PostgreSQL to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            print_success "PostgreSQL is ready!"
            return 0
        fi
        print_status "Attempt $attempt/$max_attempts - PostgreSQL not ready yet..."
        sleep 2
        ((attempt++))
    done

    print_error "PostgreSQL failed to become ready"
    return 1
}

# Function to setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."

    # Check if database exists, create if not
    if psql -h localhost -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw ai_split_videos; then
        print_status "Database 'ai_split_videos' already exists"
    else
        print_status "Creating database 'ai_split_videos'..."
        createdb -h localhost -U postgres ai_split_videos 2>/dev/null || {
            # Try with default user if postgres fails
            psql -h localhost -U postgres -c "CREATE DATABASE ai_split_videos;" 2>/dev/null || true
        }
        print_success "Database created"
    fi
}

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    print_status "Shutting down servers..."

    # Kill background jobs
    jobs -p | xargs -r kill 2>/dev/null || true

    # Kill processes on ports
    kill_port 3000
    kill_port 3001

    print_success "Cleanup complete. Goodbye!"
    exit 0
}

# Set up trap for cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

# ==========================================
# STEP 1: Clean up used ports
# ==========================================
echo ""
print_status "Step 1: Cleaning up used ports..."
kill_port 3000
kill_port 3001
print_success "Ports cleaned up"

# ==========================================
# STEP 2: Check dependencies
# ==========================================
echo ""
print_status "Step 2: Checking dependencies..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js found: $(node -v)"

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm found: $(npm -v)"

if ! command_exists psql; then
    print_warning "PostgreSQL client not found. Please install PostgreSQL."
    print_status "On macOS: brew install postgresql"
    print_status "On Ubuntu: sudo apt-get install postgresql"
fi

# ==========================================
# STEP 3: Install dependencies
# ==========================================
echo ""
print_status "Step 3: Installing dependencies..."

# Backend dependencies
print_status "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --silent
print_success "Backend dependencies installed"

# Frontend dependencies
print_status "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent
print_success "Frontend dependencies installed"

# ==========================================
# STEP 4: Create upload directories
# ==========================================
echo ""
print_status "Step 4: Creating upload directories..."
mkdir -p "$BACKEND_DIR/uploads/videos"
mkdir -p "$BACKEND_DIR/uploads/clips"
mkdir -p "$BACKEND_DIR/uploads/exports"
print_success "Upload directories created"

# ==========================================
# STEP 5: Setup database
# ==========================================
echo ""
print_status "Step 5: Setting up database..."

# Check if PostgreSQL is running
if command_exists pg_isready; then
    if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        print_warning "PostgreSQL doesn't seem to be running."
        print_status "Attempting to start PostgreSQL..."

        # Try to start PostgreSQL (macOS with Homebrew)
        if [[ "$OSTYPE" == "darwin"* ]] && command_exists brew; then
            brew services start postgresql@14 2>/dev/null || \
            brew services start postgresql 2>/dev/null || \
            pg_ctl -D /usr/local/var/postgres start 2>/dev/null || true
        fi

        # Wait a bit and check again
        sleep 3
        if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            print_error "Could not start PostgreSQL. Please start it manually."
            print_status "On macOS: brew services start postgresql"
            print_status "On Linux: sudo systemctl start postgresql"
            exit 1
        fi
    fi

    setup_database
fi

# ==========================================
# STEP 6: Run migrations
# ==========================================
echo ""
print_status "Step 6: Running database migrations..."
cd "$BACKEND_DIR"
node src/migrate.js
print_success "Migrations completed"

# ==========================================
# STEP 7: Seed database
# ==========================================
echo ""
print_status "Step 7: Seeding database with 15+ items per feature..."
cd "$BACKEND_DIR"
node src/seed.js
print_success "Database seeded successfully"

# ==========================================
# STEP 8: Start servers
# ==========================================
echo ""
print_status "Step 8: Starting servers..."

# Start backend server
print_status "Starting backend server on port 3001..."
cd "$BACKEND_DIR"
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend server is running on http://localhost:3001"
else
    print_warning "Backend server may still be starting..."
fi

# Start frontend server
print_status "Starting frontend server on port 3000..."
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!

# ==========================================
# STEP 9: Display startup info
# ==========================================
echo ""
echo "=========================================="
echo -e "${GREEN}   AI Split Videos is starting!${NC}"
echo "=========================================="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "  Demo Login Credentials:"
echo "    Email:    demo@aisplitvideo.com"
echo "    Password: demo123456"
echo ""
echo "  Or click 'Fill Demo Credentials' button on login page"
echo ""
echo "  Features seeded (15+ items each):"
echo "    - Projects"
echo "    - Videos"
echo "    - Split Jobs"
echo "    - Clips"
echo "    - Templates"
echo "    - AI Analysis"
echo "    - Exports"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "=========================================="
echo ""

# Wait for either process to exit
wait
