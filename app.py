import os
import configparser
import shutil
import subprocess
import torch
import cv2
import numpy as np
from torchvision import transforms
from torchvision.transforms.functional import to_pil_image
from flask import Flask, render_template, request, jsonify
from model import MattingRefine
from PIL import Image


app = Flask(__name__)

# Đọc config.ini
config = configparser.ConfigParser()
config.read("config.ini")
port_flask = config["PATHS"]["port"]
image_src_path = config["PATHS"]["image_src_path"]
model_path = config["PATHS"]["model_path"]
image_bgr_path = config["PATHS"]["image_bgr_path"]
output_path = config["PATHS"]["output_path"]
backup_path = config["PATHS"]["backup_path"]
save_temp_path = config["PATHS"]["save_temp_path"]
paint3d_path = config["PATHS"]["paint3d_path"]


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

    save_img_path = backup_images(img_number)

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
    file_path = image_src_path + "/" + f"img{img_number}.png"

    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")

    os.makedirs(output_path, exist_ok=True)
    result_path = os.path.join(output_path, f"img{img_number}.png")

    os.makedirs(save_temp_path, exist_ok=True)
    temp_path = os.path.join(save_temp_path, f"img{img_number}.png")

    backup_images(img_number)

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

        return jsonify({"result": True, "path_img": temp_path})
    except Exception as e:
        print("Crop border error:", e)
        return jsonify({"result": False})
    
@app.route("/crop_border_2", methods=["POST"])
def crop_border_2():
    img_number = request.form.get("img_number")
    file_path = image_src_path + "/" + f"img{img_number}.png"

    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")
    
    os.makedirs(output_path, exist_ok=True)
    result_path = os.path.join(output_path, f"img{img_number}.png")

    os.makedirs(save_temp_path, exist_ok=True)
    temp_path = os.path.join(save_temp_path, f"img{img_number}.png")
    
    backup_images(img_number)

    if not os.path.exists(file_path):
        return jsonify({"result": False})

    try:
        img = Image.open(file_path).convert("RGBA")
        pixels = img.load()

        width, height = img.size
        margin = 130

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

        return jsonify({"result": True, "path_img": temp_path})
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

def find_object_centroid_from_mask(mask):
    # mask: single-channel binary mask (0/255)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    # lấy contour lớn nhất
    c = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)
    cx = x + w / 2.0
    cy = y + h / 2.0
    return (cx, cy), (x, y, w, h)

def mask_from_image(img, method='auto'):
    # Trả về mask (uint8 0/255)
    # Nếu ảnh có alpha -> dùng alpha
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        _, mask = cv2.threshold(alpha, 0, 255, cv2.THRESH_BINARY)
        return mask
    # Nếu không có alpha, dùng Otsu trên kênh xám
    gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Loại bỏ nhiễu nhỏ
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    return mask

def center_object_horizontally(img, mask=None, max_shift=None, bg_color=(0,0,0)):
    """
    Dịch ảnh theo chiều ngang để tâm đối tượng trùng tâm ảnh.
    - img: numpy array BGR hoặc BGRA (H,W,3) hoặc (H,W,4)
    - mask: nếu có, là ảnh nhị phân 0/255 same HxW. Nếu None -> cố tự phát sinh mask.
    - max_shift: (int) nếu muốn giới hạn dịch chuyển tối đa (ví dụ: 100)
    - bg_color: màu nền khi dịch (B,G,R)
    Trả về: image đã dịch cùng số px dịch (dx)
    """
    h, w = img.shape[:2]

    if mask is None:
        mask = mask_from_image(img)
    else:
        # đảm bảo nhị phân 0/255
        if mask.ndim == 3:
            mask = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    
    res = find_object_centroid_from_mask(mask)
    if res is None:
        # không tìm thấy đối tượng -> trả ảnh gốc
        return img.copy(), 0
    (cx_obj, _), (x, y, bw, bh) = res

    cx_img = w / 2.0
    # dx: số pixel cần dịch dương => ảnh dịch sang phải
    dx = cx_img - cx_obj
    # làm tròn thành int
    dx = int(round(dx))

    # giới hạn dịch chuyển nếu cần
    if max_shift is not None:
        if dx > max_shift:
            dx = int(max_shift)
        elif dx < -max_shift:
            dx = int(-max_shift)

    # M = [[1, 0, tx],
    #      [0, 1, ty]]
    M = np.float32([[1, 0, dx], [0, 1, 0]])

    # nếu ảnh có alpha, preserve alpha channel
    if img.shape[2] == 4:
        bgr = img[:, :, :3]
        alpha = img[:, :, 3]
        moved_bgr = cv2.warpAffine(bgr, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=bg_color)
        moved_alpha = cv2.warpAffine(alpha, M, (w, h), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        out = cv2.merge([moved_bgr[:, :, 0], moved_bgr[:, :, 1], moved_bgr[:, :, 2], moved_alpha])
    else:
        out = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=bg_color)

    return out, dx

# ---- route chính ----
@app.route("/center_object", methods=["POST"])
def center_route():
    img_number = request.form.get("img_number")
    if not img_number:
        return jsonify({"result": False, "error": "Missing img_number"}), 400

    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")
    result_path = os.path.join(output_path, f"img{img_number}.png")

    # đảm bảo ảnh tồn tại
    if not os.path.exists(save_img_path):
        return jsonify({"result": False, "error": "Image not found"}), 404

    # đọc ảnh (cả RGBA nếu có)
    img = cv2.imread(save_img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return jsonify({"result": False, "error": "Cannot read image"}), 400

    out, dx = center_object_horizontally(img)

    # đảm bảo thư mục output tồn tại
    os.makedirs(output_path, exist_ok=True)
    cv2.imwrite(save_img_path, out)
    cv2.imwrite(result_path, out)

    return jsonify({"result": True, "path_img": f"/{result_path}"})

def backup_images(img_number):
    os.makedirs(backup_path, exist_ok=True)
    backup_img_path = os.path.join(backup_path, f"img{img_number}.png")
    save_img_path = os.path.join(image_src_path, f"img{img_number}.png")

    if not os.path.exists(backup_img_path) and os.path.exists(save_img_path):
        shutil.copy2(save_img_path, backup_img_path)
        print(f"Đã sao lưu ảnh gốc tại: {backup_img_path}")
    
    return save_img_path

if __name__ == "__main__":
    app.run(port=port_flask, debug=True)
