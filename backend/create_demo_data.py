import os
import pandas as pd
import numpy as np

# Ensure demo datasets directory exists
os.makedirs("sample_data", exist_ok=True)

# 1. Customer Churn Dataset
np.random.seed(42)
n_churn = 300
tenure = np.random.randint(1, 72, n_churn)
monthly_charges = np.round(np.random.uniform(20.0, 120.0, n_churn), 2)
total_charges = np.round(tenure * monthly_charges + np.random.normal(0, 15, n_churn), 2)
contract_types = np.random.choice(["Month-to-Month", "One Year", "Two Year"], n_churn, p=[0.55, 0.25, 0.20])
support_tickets = np.random.poisson(2.5, n_churn)
# Probability of churn correlated with month-to-month and high charges and tickets
churn_prob = (
    (contract_types == "Month-to-Month") * 0.35 +
    (monthly_charges > 70) * 0.25 +
    (support_tickets > 3) * 0.30 +
    (tenure < 12) * 0.15
)
churn_prob = np.clip(churn_prob, 0.05, 0.95)
churn = [1 if np.random.rand() < p else 0 for p in churn_prob]

df_churn = pd.DataFrame({
    "customer_id": [f"CUST-{1000 + i}" for i in range(n_churn)],
    "tenure_months": tenure,
    "monthly_charges": monthly_charges,
    "total_charges": total_charges,
    "contract_type": contract_types,
    "tech_support_tickets": support_tickets,
    "churn": churn
})
df_churn.to_csv("sample_data/customer_churn.csv", index=False)

# 2. E-Commerce Sales & Revenue (Regression)
n_sales = 350
ad_spend = np.round(np.random.uniform(500, 15000, n_sales), 2)
website_visits = np.round(ad_spend * 1.8 + np.random.normal(2000, 500, n_sales))
conversion_rate = np.round(np.random.uniform(0.015, 0.065, n_sales), 4)
discount_pct = np.random.choice([0, 5, 10, 15, 20, 25], n_sales)
product_category = np.random.choice(["Electronics", "Fashion", "Home & Kitchen", "Fitness"], n_sales)
revenue = np.round(
    website_visits * conversion_rate * 120.0 + 
    ad_spend * 0.85 - 
    discount_pct * 40.0 + 
    np.random.normal(1000, 300, n_sales), 2
)

df_sales = pd.DataFrame({
    "campaign_id": [f"CMP-{2000 + i}" for i in range(n_sales)],
    "ad_spend": ad_spend,
    "website_visits": website_visits.astype(int),
    "conversion_rate": conversion_rate,
    "discount_pct": discount_pct,
    "product_category": product_category,
    "revenue": revenue
})
df_sales.to_csv("sample_data/ecommerce_sales.csv", index=False)

# 3. Healthcare Diagnostics (Classification)
n_health = 250
age = np.random.randint(25, 80, n_health)
bmi = np.round(np.random.uniform(18.5, 38.5, n_health), 1)
glucose_level = np.round(np.random.uniform(70, 220, n_health), 1)
blood_pressure = np.random.randint(90, 175, n_health)
insulin = np.round(np.random.uniform(15, 280, n_health), 1)
high_risk_prob = (
    (glucose_level > 140) * 0.4 +
    (bmi > 30) * 0.25 +
    (age > 50) * 0.2 +
    (blood_pressure > 135) * 0.15
)
high_risk_prob = np.clip(high_risk_prob, 0.05, 0.95)
diagnosis_risk = [1 if np.random.rand() < p else 0 for p in high_risk_prob]

df_health = pd.DataFrame({
    "patient_id": [f"PAT-{5000 + i}" for i in range(n_health)],
    "age": age,
    "bmi": bmi,
    "glucose_level": glucose_level,
    "blood_pressure": blood_pressure,
    "insulin": insulin,
    "outcome_risk": diagnosis_risk
})
df_health.to_csv("sample_data/healthcare_diagnostics.csv", index=False)

print("Demo datasets generated successfully in backend/sample_data/")
