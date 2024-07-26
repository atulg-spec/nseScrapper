import requests
import os
import pandas as pd
from urllib.parse import urlparse
from threading import Thread

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

# Function to download file from URL
def download_file(url, destination_folder):
    try:
        # Parse the URL to get the filename
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path)
        
        # Make a request to download the file
        response = requests.get(url, headers=headers, stream=True)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Write to file in the specified destination folder
            with open(os.path.join(destination_folder, filename), 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        f.write(chunk)
            print(f"Downloaded {filename}")
        else:
            print(f"Failed to download {url}. Status code: {response.status_code}")
    except Exception as e:
        print(f"Error downloading {url}: {str(e)}")

# Function to process CSV files in a directory
def process_csv_files(directory, downloads_folder):
    try:
        # Iterate through files in the directory
        for filename in os.listdir(directory):
            if filename.endswith('.csv'):
                csv_path = os.path.join(directory, filename)
                # Create a folder in downloads folder with the name of the CSV file (without extension)
                csv_folder_name = os.path.splitext(filename)[0]
                destination_folder = os.path.join(downloads_folder, csv_folder_name)
                os.makedirs(destination_folder, exist_ok=True)
                
                # Read the CSV file using pandas
                df = pd.read_csv(csv_path)
                
                # List to store threads
                threads = []
                
                # Iterate through rows in the CSV file
                for index, row in df.iterrows():
                    url = row['URL']
                    # Create and start a new thread for each download
                    thread = Thread(target=download_file, args=(url, destination_folder))
                    thread.start()
                    threads.append(thread)
                
                # Wait for all threads to complete
                for thread in threads:
                    thread.join()
    except Exception as e:
        print(f"Error processing CSV files: {str(e)}")

# Specify your directory and downloads folder
directory_with_csv = 'files'  # Replace with your directory path
downloads_folder = os.path.join(os.path.expanduser('~'), 'Downloads')

# Call the function to process CSV files and download
process_csv_files(directory_with_csv, downloads_folder)
