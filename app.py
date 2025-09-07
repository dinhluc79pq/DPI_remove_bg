import os
import configparser
import shutil
import subprocess
import torch
from torchvision import transforms
from torchvision.transforms.functional import to_pil_image
from flask import Flask, render_template, request, jsonify
from model import MattingRefine
from PIL import Image

app = Flask(__name__)

# Đọc config.ini
config = configparser.ConfigParser()
config.read("config.ini")
image_src_path = config["PATHS"]["image_src_path"]
model_path = config["PATHS"]["model_path"]
image_bgr_path = config["PATHS"]["image_bgr_path"]
output_path = config["PATHS"]["output_path"]
backup_path = config["PATHS"]["backup_path"]
save_temp_path = config["PATHS"]["save_temp_path"]


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/find_image", methods=["POST"])
def find_image():
    img_number = request.form.get("img_number") 
    if not img_number:
        return jsonify({"result": False})

    result_path = os.path.join(output_path, f"img{img_number}.png")
    file_path = os.path.join(image_src_path, f"img{img_number}.png")
    
    if os.path.exists(result_path):
        return jsonify({"result": True, "path_img": f"{result_path}"})

    elif os.path.exists(file_path):
        if os.path.exists(file_path):
            output_dir = os.path.join("static", "input")
            os.makedirs(output_dir, exist_ok=True)

            output_file = os.path.join(output_dir, f"img{img_number}.png")

            shutil.copyfile(file_path, output_file)
            return jsonify({"result": True, "path_img": f"{output_file}"})
    
    else:
        return jsonify({"result": False})
    
@app.route("/remove_bg", methods=["POST"])
def remove_bg():
    img_number = request.form.get("img_number")

    file_path = os.path.join(image_src_path, "RawFiles", f"img{img_number}.jpg")
    os.makedirs(output_path, exist_ok=True)
    result_path = os.path.join(output_path, f"img{img_number}.png")
    os.makedirs(backup_path, exist_ok=True)
    backup_img_path = os.path.join(backup_path, f"img{img_number}.png")
    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")

    if not os.path.exists(backup_img_path) and os.path.exists(save_img_path):
        shutil.copy2(save_img_path, backup_img_path)
        print(f"Đã sao lưu ảnh gốc tại: {backup_img_path}")

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    transform = transforms.Compose([transforms.ToTensor()])

    model = MattingRefine('resnet101', 0.25, 'thresholding', 80000, 0.25, 3)
    model.load_state_dict(torch.load(model_path, map_location=device), strict=False)
    model = model.to(device).eval()

    src = transform(Image.open(file_path)).unsqueeze(0).to(device)
    bgr = transform(Image.open(image_bgr_path)).unsqueeze(0).to(device)

    with torch.no_grad():
        pha, fgr, *_ = model(src, bgr)
        com = torch.cat([fgr * pha.ne(0), pha], dim=1)

    pil_img = to_pil_image(com[0].cpu())
    pil_img.save(result_path, format="PNG")
    pil_img.save(save_img_path, format="PNG")

    print(f'Đã lưu ảnh đã tách nền tại: {result_path}')

    return jsonify({"result": True, "path_img": result_path})

@app.route("/open_in_paint3d", methods=["POST"])
def open_in_paint3d():
    img_number = request.form.get("img_number")
    file_path = os.path.abspath(os.path.join(image_src_path, f"img{img_number}.png"))

    paint3d_path = r"C:\Program Files\WindowsApps\Microsoft.MSPaint_6.2410.13017.0_x64__8wekyb3d8bbwe\PaintStudio.View.exe"

    if os.path.exists(file_path):
        try:
            # subprocess.Popen([paint3d_exe, file_path])
            subprocess.Popen([paint3d_path, file_path], shell=True)
            # subprocess.Popen(["start", "ms-paint3d:", file_path], shell=True)
            return jsonify({"result": True})
        except Exception as e:
            return jsonify({"result": False, "error": str(e)})
    else:
        return jsonify({"result": False, "error": "File không tồn tại"})
    
@app.route("/crop_border", methods=["POST"])
def crop_border():
    img_number = request.form.get("img_number")
    file_path = output_path + "/" + f"img{img_number}.png"

    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")

    os.makedirs(output_path, exist_ok=True)
    result_path = os.path.join(output_path, f"img{img_number}.png")

    os.makedirs(save_temp_path, exist_ok=True)
    temp_path = os.path.join(save_temp_path, f"img{img_number}.png")

    if not os.path.exists(file_path):
        return jsonify({"result": False})

    try:
        img = Image.open(file_path).convert("RGBA")
        pixels = img.load()

        width, height = img.size
        margin = 100 

        for y in range(height):
            for x in range(width):
                # Xóa viền trái, phải
                if x < margin or x >= width - margin:
                    r, g, b, a = pixels[x, y]
                    pixels[x, y] = (r, g, b, 0)

                # Xóa viền trên
                elif y < margin:
                    r, g, b, a = pixels[x, y]
                    pixels[x, y] = (r, g, b, 0)

        # Lưu ảnh mới
        img.save(save_img_path, "PNG")
        img.save(result_path, "PNG")
        img.save(temp_path, "PNG")

        return jsonify({"result": True, "path_img": result_path})
    except Exception as e:
        print("Crop border error:", e)
        return jsonify({"result": False})
    
@app.route("/crop_border_2", methods=["POST"])
def crop_border_2():
    img_number = request.form.get("img_number")
    file_path = output_path + "/" + f"img{img_number}.png"

    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")
    
    os.makedirs(output_path, exist_ok=True)
    result_path = os.path.join(output_path, f"img{img_number}.png")

    os.makedirs(save_temp_path, exist_ok=True)
    temp_path = os.path.join(save_temp_path, f"img{img_number}.png")
    

    if not os.path.exists(file_path):
        return jsonify({"result": False})

    try:
        img = Image.open(file_path).convert("RGBA")
        pixels = img.load()

        width, height = img.size
        margin = 100 

        for y in range(height):
            for x in range(width):
                # Xóa viền trên
                if y < margin:
                    r, g, b, a = pixels[x, y]
                    pixels[x, y] = (r, g, b, 0)

        # Lưu ảnh mới
        img.save(save_img_path, "PNG")
        img.save(result_path, "PNG")
        img.save(temp_path, "PNG")

        return jsonify({"result": True, "path_img": result_path})
    except Exception as e:
        print("Crop border error:", e)
        return jsonify({"result": False})

@app.route("/reload_img", methods=["POST"])
def reload_img():
    img_number = request.form.get("img_number")

    os.makedirs(backup_path, exist_ok=True)
    backup_img_path = os.path.join(backup_path, f"img{img_number}.png")

    os.makedirs(output_path, exist_ok=True)
    result_path = os.path.join(output_path, f"img{img_number}.png")

    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")

    os.remove(save_img_path)
    shutil.copy2(backup_img_path, save_img_path)
    shutil.copy2(backup_img_path, result_path)

    if not os.path.exists(backup_path):
        return jsonify({"result": False})

    return jsonify({"result": True, "path_img": backup_img_path})

if __name__ == "__main__":
    app.run(debug=True)
