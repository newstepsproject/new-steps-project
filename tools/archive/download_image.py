import urllib.request
import os

def download_image(url, save_path):
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Download the image
        urllib.request.urlretrieve(url, save_path)
        
        print(f"Image downloaded successfully to {save_path}")
        return True
    except Exception as e:
        print(f"Error downloading image: {e}")
        return False

if __name__ == "__main__":
    # URL of the image to download
    image_url = "https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?ixlib=rb-4.0.4&q=85&fm=jpg&crop=entropy&cs=srgb&w=800"
    
    # Path where to save the image
    save_path = "public/images/money-donation.jpg"
    
    download_image(image_url, save_path) 