def hash_student_id(student_id):
    """
    Hashes a student ID using a consistent algorithm.
    This must match the frontend implementation exactly.
    
    Args:
        student_id (str): The student ID to hash
        
    Returns:
        str: The hashed student ID
    """
    hash_value = 0
    for char in str(student_id):
        hash_value = ((hash_value << 5) - hash_value) + ord(char)
        hash_value = hash_value & hash_value  # Convert to 32bit integer
    return str(hash_value) 