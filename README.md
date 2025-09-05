# Image Processing Web App - Flask + PyTorch

A web application built with **Flask**, using **PyTorch** and **PIL** for image processing:  
- Background removal (`remove_bg`)  
- Extra background cleanup (`remove_extra_bg`)  
- Reload original image from backup (`reload_img`)  
- Open image in Paint 3D (Windows only)  

The frontend UI is styled with **Tailwind CSS**.

---

## 📌 Requirements
- Python 3.8+
- Pip & Virtualenv
- CUDA-enabled GPU (optional, app runs on CPU if not available)

---

## 📥 Installation

1. **Clone the project**
   ```bash
   git clone https://github.com/dinhluc79pq/DPI_remove_bg.git
   cd DPI_remove_bg

2. Create a virtual environment
    python -m venv venv

3. Activate the virtual environment
    - Windows:
        dpi_env\Scripts\activate

    - Linux/macOS:
        source dpi_env/bin/activate

4. Install dependencies
    pip install -r requirements.txt

5. Download file model for remove background
    - Link: https://drive.google.com/file/d/18dvWHr1xC9hODLUQDD-hWuxSmQz32Rf6/view?usp=sharing
    - Copy to path: DPI_remove_bg/model/

⚙️ Configuration (config.ini)

The app uses a config.ini file to store image paths and model configuration.
Before running, make sure to update the paths to match your environment.

Example config.ini:
    [PATHS]
    image_src_path = static
    output_path = static/results
    model_path = models/matting_refine.pth
    image_bgr_path = static/backgrounds/default.jpg

image_src_path → base folder containing RawFiles/, input/, backup/
output_path → folder where processed images will be saved
model_path → path to your trained PyTorch model file (.pth)
image_bgr_path → background image used in matting

🚀 Run the app
    python app.py

⚙️ Features
1. 🔍 Search and display image

    Enter the image number into err_imgNumber input → click Search

    The app loads the image from static/RawFiles/

2. ✂️ Background removal (remove_bg)

    Click Remove Background

    The model processes the image and saves results:

    static/results/imgXXXX.png → PNG (transparent background)

    static/imgXXXX.jpg → overwritten original

    The original image is backed up once in static/backup/

3. 🖌️ Extra background cleanup (remove_extra_bg)

    Click Remove Extra Background to clean up remaining background artifacts.

4. 🔄 Reload original (reload_img)

    Click Reload Image → loads the image from the backup folder.

5. 🎨 Open in Paint 3D (open_paint3d)

    Click Open in Paint 3D → launches the Paint 3D app on Windows.

    Due to Windows API limitations, Paint 3D opens separately, and the user selects the file manually.

🛠️ Technical Notes

    If a CUDA GPU is available, the model runs on GPU; otherwise, it falls back to CPU.

    The backup/ folder only stores the first original copy to prevent overwriting.

    When saving, the app creates both PNG (processed result) and JPG (overwritten original) versions.

📧 Support

For issues or support, please contact:
📩 Email: luc@dpi.asia
📌 GitHub Issues: https://github.com/dinhluc79pq/DPI_remove_bg.git