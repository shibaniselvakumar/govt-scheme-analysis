#!/bin/bash
# CIP Project - Automated Setup Script (Linux/Mac Version)
# Run this script from the project root directory
# Usage: bash setup.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_ok=true
    
    # Check Python
    if command -v python3 &> /dev/null; then
        python_version=$(python3 --version 2>&1)
        print_success "Python found: $python_version"
    else
        print_error "Python3 not found - this is required"
        all_ok=false
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        node_version=$(node --version)
        print_success "Node.js found: $node_version"
    else
        print_error "Node.js not found - this is required"
        all_ok=false
    fi
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL found"
    else
        print_warning "PostgreSQL not found in PATH - ensure it's installed and running"
    fi
    
    # Check MongoDB
    if command -v mongod &> /dev/null; then
        print_success "MongoDB found"
    else
        print_warning "MongoDB not found in PATH - ensure it's installed and running"
    fi
    
    if [ "$all_ok" = false ]; then
        print_error "Some required prerequisites are missing"
        exit 1
    fi
}

# Setup virtual environment
setup_venv() {
    print_header "Setting Up Virtual Environment"
    
    if [ -d "venv" ]; then
        print_warning "Virtual environment already exists, skipping creation"
    else
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    print_success "Virtual environment activated"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Python Dependencies"
    
    pip install --upgrade pip
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Create PostgreSQL database
create_postgres_db() {
    print_header "Creating PostgreSQL Database"
    
    if psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'schemes_users'" | grep -q 1; then
        print_warning "Database 'schemes_users' already exists"
    else
        psql -U postgres -c "CREATE DATABASE schemes_users;"
        print_success "Database 'schemes_users' created"
    fi
}

# Run data initialization
run_data_initialization() {
    print_header "Initializing Data"
    
    cd others
    
    echo -e "\n[1/3] Populating MongoDB with scheme data..."
    python3 database_creation.py
    if [ $? -ne 0 ]; then
        print_error "Database creation failed"
        cd ..
        exit 1
    fi
    print_success "Scheme data inserted"
    
    echo -e "\n[2/3] Generating embeddings..."
    python3 embed_schemes.py
    if [ $? -ne 0 ]; then
        print_error "Embedding generation failed"
        cd ..
        exit 1
    fi
    print_success "Embeddings generated"
    
    echo -e "\n[3/3] Building FAISS indexes..."
    python3 build_faiss.py
    if [ $? -ne 0 ]; then
        print_error "FAISS index building failed"
        cd ..
        exit 1
    fi
    print_success "FAISS indexes built"
    
    cd ..
}

# Main execution
main() {
    print_header "CIP PROJECT AUTOMATED SETUP"
    
    check_prerequisites
    setup_venv
    install_dependencies
    create_postgres_db
    run_data_initialization
    
    print_header "SETUP COMPLETED SUCCESSFULLY!"
    
    echo -e "${GREEN}Next steps:${NC}\n"
    echo "1. Open TWO terminal windows\n"
    echo -e "${BLUE}Terminal 1 (Backend):${NC}"
    echo "   - Run: cd backend"
    echo "   - Run: source ../venv/bin/activate"
    echo "   - Run: python app.py"
    echo "   - Backend will start on http://localhost:5000\n"
    echo -e "${BLUE}Terminal 2 (Frontend):${NC}"
    echo "   - Run: cd frontend"
    echo "   - Run: npm run dev"
    echo "   - Frontend will start on http://localhost:3000\n"
    echo -e "${BLUE}3. Open your browser and go to:${NC}"
    echo "   http://localhost:3000\n"
    echo -e "${GREEN}============================================================${NC}"
    echo "Setup complete! Happy coding!"
    echo -e "${GREEN}============================================================${NC}\n"
}

# Run main function
main
