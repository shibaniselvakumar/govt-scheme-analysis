#!/usr/bin/env python3
"""
CIP PROJECT AUTOMATED SETUP SCRIPT
Handles all project initialization including:
- Virtual environment setup
- Dependency installation
- PostgreSQL database creation
- MongoDB data population
- Embedding generation
- FAISS index building
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def run_command(command, description, check_error=True):
    """Execute a shell command and report status"""
    print(f"Running: {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print_success(description)
            return True
        else:
            if check_error:
                print_error(f"{description}\n{result.stderr}")
                return False
            else:
                print_warning(f"{description} - Continuing anyway")
                return True
    except Exception as e:
        if check_error:
            print_error(f"{description}: {str(e)}")
            return False
        else:
            print_warning(f"{description}: {str(e)} - Continuing anyway")
            return True

def check_prerequisites():
    """Check if all prerequisites are installed"""
    print_header("Checking Prerequisites")
    
    checks = {
        "Python": "python --version",
        "Node.js": "node --version",
        "PostgreSQL": "psql --version",
        "MongoDB": "mongod --version"
    }
    
    all_ok = True
    for name, cmd in checks.items():
        try:
            subprocess.run(cmd, shell=True, capture_output=True, timeout=5)
            print_success(f"{name} found")
        except Exception as e:
            if name in ["MongoDB", "PostgreSQL"]:
                print_warning(f"{name} not found in PATH - verify it's installed and running")
                all_ok = False
            else:
                print_error(f"{name} not found - this is required")
                all_ok = False
    
    return all_ok

def setup_venv():
    """Create and activate virtual environment"""
    print_header("Setting Up Virtual Environment")
    
    venv_path = Path("venv")
    if venv_path.exists():
        print_warning("Virtual environment already exists, skipping creation")
    else:
        if run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
            print_success("Virtual environment created")
        else:
            return False
    
    return True

def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Dependencies")
    
    if sys.platform == "win32":
        pip_cmd = "venv\\Scripts\\pip install -r requirements.txt"
    else:
        pip_cmd = "source venv/bin/activate && pip install -r requirements.txt"
    
    return run_command(pip_cmd, "Installing Python dependencies")

def create_postgres_db():
    """Create PostgreSQL database"""
    print_header("Creating PostgreSQL Database")
    
    try:
        # Try to connect and create database
        cmd = 'psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = \'schemes_users\'"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if "1" in result.stdout:
            print_warning("Database 'schemes_users' already exists")
        else:
            create_cmd = 'psql -U postgres -c "CREATE DATABASE schemes_users;"'
            if subprocess.run(create_cmd, shell=True, capture_output=True).returncode == 0:
                print_success("Database 'schemes_users' created")
            else:
                print_warning("Could not create database - ensure PostgreSQL is running")
    except Exception as e:
        print_warning(f"PostgreSQL check failed: {str(e)}")
        print_warning("Ensure PostgreSQL service is running and accessible")

def run_data_initialization():
    """Run the data initialization scripts"""
    print_header("Initializing Data")
    
    original_cwd = os.getcwd()
    os.chdir("others")
    
    try:
        # Database creation
        print("\n[1/3] Populating MongoDB with scheme data...")
        if not run_command(f"{sys.executable} database_creation.py", "Database creation"):
            os.chdir(original_cwd)
            return False
        print_success("Scheme data inserted")
        
        # Embeddings
        print("\n[2/3] Generating embeddings...")
        if not run_command(f"{sys.executable} embed_schemes.py", "Embedding generation"):
            os.chdir(original_cwd)
            return False
        print_success("Embeddings generated")
        
        # FAISS indexes
        print("\n[3/3] Building FAISS indexes...")
        if not run_command(f"{sys.executable} build_faiss.py", "FAISS index building"):
            os.chdir(original_cwd)
            return False
        print_success("FAISS indexes built")
        
        os.chdir(original_cwd)
        return True
        
    except Exception as e:
        print_error(f"Data initialization failed: {str(e)}")
        os.chdir(original_cwd)
        return False

def main():
    """Main setup orchestration"""
    print_header("CIP PROJECT AUTOMATED SETUP")
    
    # Check prerequisites
    if not check_prerequisites():
        print_error("Some prerequisites are missing. Please install them and try again.")
        return False
    
    # Setup virtual environment
    if not setup_venv():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Create PostgreSQL database
    create_postgres_db()
    
    # Run data initialization
    if not run_data_initialization():
        return False
    
    # Success!
    print_header("SETUP COMPLETED SUCCESSFULLY!")
    
    print(f"{Colors.GREEN}Next steps:{Colors.END}\n")
    print("1. Open TWO terminal windows\n")
    print(f"{Colors.BLUE}Terminal 1 (Backend):{Colors.END}")
    print("   - Run: cd backend")
    print("   - Run: python app.py")
    print("   - Backend will start on http://localhost:5000\n")
    print(f"{Colors.BLUE}Terminal 2 (Frontend):{Colors.END}")
    print("   - Run: cd frontend")
    print("   - Run: npm run dev")
    print("   - Frontend will start on http://localhost:3000\n")
    print(f"{Colors.BLUE}3. Open your browser and go to:{Colors.END}")
    print("   http://localhost:3000\n")
    
    print(f"{Colors.GREEN}{'='*60}")
    print("Setup complete! Happy coding!")
    print(f"{'='*60}{Colors.END}\n")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_error("\nSetup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)
