import os
import shutil

# Get the path to the Downloads folder
downloads_folder = os.path.join(os.path.expanduser('~'), 'Downloads')

# Create a folder for each file before the '@' and save the file after the '@'
for filename in os.listdir(downloads_folder):
    if '@' in filename:
        before_at, after_at = filename.split('@', 1)
        # Create the folder if it does not exist
        folder_path = os.path.join(downloads_folder, before_at.strip())
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
        # Move the file to the new folder with the name after the '@'
        new_file_path = os.path.join(folder_path, after_at.strip())
        old_file_path = os.path.join(downloads_folder, filename)
        shutil.move(old_file_path, new_file_path)

print("Files organized successfully.")
