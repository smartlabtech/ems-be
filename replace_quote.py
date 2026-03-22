import os

def replace_text_in_files():
    # Get the current folder where the script is located
    folder_path = os.path.dirname(os.path.abspath(__file__))

    # Iterate over all files in the given folder
    for root, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.py'):
                # Skip the script file itself
                continue

            file_path = os.path.join(root, file)

            # Open and read the content of the file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Replace "tag" with "quote" and "Tag" with "Quote"
                updated_content = content.replace('quote', 'FAQ').replace('Quote', 'FAQ')

                # Write the updated content back to the file if changes were made
                if content != updated_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                    print(f"Updated file: {file_path}")
                else:
                    print(f"No changes needed in file: {file_path}")
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")

if __name__ == "__main__":
    replace_text_in_files()
