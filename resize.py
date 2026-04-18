from PIL import Image

input_path = "./frontend/assets/challenge.png"
output_path = "./frontend/assets/challenge.png"

max_size = (40, 40)

with Image.open(input_path) as img:
    img.thumbnail(max_size)
    img.save(output_path)

print(f"Image resized and saved to {output_path}")
