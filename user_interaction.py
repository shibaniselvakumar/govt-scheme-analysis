# user_interaction.py

def get_user_profile():
    """
    Collects basic user profile information required for eligibility checking.
    Returns a dictionary that can be passed directly to Agent 2.
    """
    print("===== User Profile Input =====")
    # profile = {}

    # profile["name"] = input("Full Name: ").strip()
    # profile["age"] = int(input("Age: ").strip())
    # profile["gender"] = input("Gender: ").strip()
    # profile["state"] = input("State of Residence: ").strip()
    # profile["occupation"] = input("Occupation: ").strip()
    # profile["monthly_income"] = float(input("Monthly Income (INR): ").strip())
    
    # Optional: Add more fields as required by schemes
    # e.g., category, disability status, marital status, farmer type, etc.
    
    print("\n✅ User profile collected successfully!\n")

    test_profile = {
        "name": "Asha Devi",
        "age": 34,
        "gender": "Female",  
        "state": "Uttar Pradesh",
        "occupation": "Farmer",    
        "monthly_income": 8000.0,
    }
    return test_profile

# Example usage
if __name__ == "__main__":
    user_profile = get_user_profile()
    print(user_profile)
