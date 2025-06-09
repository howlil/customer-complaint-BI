import pandas as pd
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Constants
DEFAULT_VALUES = {
    'sub_product': 'Not Specified',
    'sub_issue': 'General',
    'consumer_complaint_narrative': 'No Narrative',
    'company_public_response': 'No Response',
    'tags': 'No Tag',
    'consumer_consent_provided': 'Not Provided',
    'complaint_id': -1
}

INPUT_FILE = "consumer_complaints.csv"
OUTPUT_FILE = "cleaned_consumer_complaints.csv"

try:
    # Load data
    logging.info(f"Loading data from {INPUT_FILE}")
    data = pd.read_csv(INPUT_FILE)
    
    # Check initial missing values
    logging.info("Checking initial missing values")
    print(data.isnull().sum())
    
    # Fill missing values
    logging.info("Filling missing values")
    for column, default_value in DEFAULT_VALUES.items():
        if column in data.columns:
            data[column] = data[column].fillna(default_value)
    
    # Handle zipcode separately due to special transformation
    data['zipcode'] = data['zipcode'].apply(lambda x: str(x)[:5] if pd.notnull(x) else '00000')
    
    # Validate data types
    logging.info("Validating data types")
    data['complaint_id'] = data['complaint_id'].astype(int)
    
    # Check final missing values
    logging.info("Checking final missing values")
    print("\nSetelah diisi:\n", data.isnull().sum())
    
    # Save cleaned data
    logging.info(f"Saving cleaned data to {OUTPUT_FILE}")
    data.to_csv(OUTPUT_FILE, index=False)
    logging.info("ETL process completed successfully")

except FileNotFoundError:
    logging.error(f"Input file {INPUT_FILE} not found")
    raise
except Exception as e:
    logging.error(f"An error occurred during ETL process: {str(e)}")
    raise