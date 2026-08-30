import os
from dotenv import load_dotenv
import razorpay

load_dotenv(override=True)

key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()

print("Key ID:", key_id)
print("Key ID starts with rzp_test:", key_id.startswith("rzp_test_"))
print("Secret loaded:", bool(key_secret))
print("Secret length:", len(key_secret))

client = razorpay.Client(auth=(key_id, key_secret))

order_data = {
    "amount": 1000,
    "currency": "INR",
    "receipt": "test_receipt_001"
}

order = client.order.create(data=order_data)

print("Key ID:", key_id)
print("Test key:", key_id.startswith("rzp_test_"))
print("Secret loaded:", bool(key_secret))
print("Secret length:", len(key_secret))