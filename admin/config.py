# ----- Config helpers -----
# def load_config():
#     cfg = configparser.ConfigParser()
#     if os.path.exists(CONFIG_FILE):
#         cfg.read(CONFIG_FILE)
#     if "PATHS" not in cfg:
#         cfg["PATHS"] = {}
#     # Đảm bảo có đủ keys
#     for k in ["model_path", "image_src_path", "image_bgr_path", "output_path", "backup_path"]:
#         cfg["PATHS"].setdefault(k, "")
#     return cfg

import os
import json
import configparser
import webview

CONFIG_FILE = "config.ini"

def load_config():
    cfg = configparser.ConfigParser()
    if os.path.exists(CONFIG_FILE):
        cfg.read(CONFIG_FILE, encoding="utf-8")
    if "PATHS" not in cfg:
        cfg["PATHS"] = {}
    return cfg

def save_config(paths_dict):
    cfg = load_config()
    for k, v in paths_dict.items():
        cfg["PATHS"][k] = v
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        cfg.write(f)
    return True

class Api:
    def __init__(self, window):
        self.window = window

    def get_config(self):
        """Trả về config hiện tại cho UI (dict)."""
        cfg = load_config()
        return dict(cfg["PATHS"])

    def pick_dir(self):
        """Mở hộp thoại chọn thư mục và trả về absolute path."""
        result = self.window.create_file_dialog(webview.FOLDER_DIALOG)
        return result[0] if result else ""

    def pick_file_model(self):
        """Chọn file model (ví dụ .pth)."""
        result = self.window.create_file_dialog(
            webview.OPEN_DIALOG,
            allow_multiple=False,
            file_types=["All files (*.*)"]
        )
        return result[0] if result else ""

    def save_paths(self, paths_json):
        """Nhận JSON string từ UI và lưu vào config.ini"""
        try:
            data = json.loads(paths_json)
            save_config(data)
            return {"ok": True, "message": "Đã lưu config.ini thành công."}
        except Exception as e:
            return {"ok": False, "message": f"Lỗi lưu config: {e}"}

if __name__ == "__main__":
    api = Api(None)

    window = webview.create_window(
        title="Cấu hình đường dẫn",
        url=os.path.abspath(os.path.join("admin", "config.html")),
        width=720,
        height=640,
        resizable=True,
        js_api=api
    )

    api.window = window

    webview.start(debug=False, http_server=True)