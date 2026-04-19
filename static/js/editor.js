let canvas, ctx

let img = new Image()

let scale = 1
let offsetX = 0
let offsetY = 0

let brushSize = 25
let selectedColor = [0, 0, 0]

let isDragging = false
let lastX, lastY

let isSpacePressed = false

let removeMode = false

let history = []
let redoStack = []

let isDrawing = false

let bufferCanvas = document.createElement("canvas")
let bufferCtx = bufferCanvas.getContext("2d")

let colorThreshold = 40

let numGlobal = 0
let showCursor = true

let imageFrame = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
}

// ================= INIT =================

function initEditor(src, number) {

    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")

    resizeCanvas()

    img.onload = function () {

        bufferCanvas.width = img.width
        bufferCanvas.height = img.height

        bufferCtx.setTransform(1, 0, 0, 1, 0, 0)

        bufferCtx.drawImage(img, 0, 0)

        fitImage()
        saveState()

    }

    img.src = src
    numGlobal = number

    bindEvents()

}

// ================= CANVAS =================

function resizeCanvas() {
    canvas.width = window.innerWidth - 260
    canvas.height = window.innerHeight
}

function fitImage() {

    let maxW = canvas.width
    let maxH = canvas.height

    scale = Math.min(maxW / img.width, maxH / img.height)

    offsetX = (canvas.width - img.width * scale) / 2
    offsetY = (canvas.height - img.height * scale) / 2

    imageFrame.width = img.width
    imageFrame.height = img.height

    imageFrame.x = offsetX
    imageFrame.y = offsetY

    draw()

}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()

    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    ctx.drawImage(bufferCanvas, 0, 0)
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2 / scale
    ctx.strokeRect(0, 0, img.width, img.height)

    ctx.restore()

}

// ================= EVENTS =================

function bindEvents() {

    // Mouse move
    canvas.addEventListener("mousemove", e => {

        let rect = canvas.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top

        // kéo ảnh
        if (isDragging) {
            offsetX += x - lastX
            offsetY += y - lastY
        }

        if (isSpacePressed) {
            canvas.style.cursor = "grabbing"
        } else {
            canvas.style.cursor = "default"
        }

        // remove chỉ khi đang giữ chuột
        if (!isSpacePressed && isDrawing) {

            if (removeMode) {
                removeColorCircle(x, y)
            }

            if (eraserMode) {
                eraseCircle(x, y)
            }

        }
        // redraw + cursor
        draw()
        drawCursor(x, y)

        lastX = x
        lastY = y

    })

    canvas.addEventListener("mousedown", () => {

        if (isSpacePressed) {
            isDragging = true
            return
        }

        if (removeMode || eraserMode) {
            isDrawing = true
            redoStack = []
        } else {
            isDragging = true
        }
    })

    canvas.addEventListener("mouseup", () => {
        isDrawing = false
        isDragging = false
        saveState()
    })

    // Zoom
    canvas.addEventListener("wheel", e => {

        e.preventDefault()

        let rect = canvas.getBoundingClientRect()

        let mouseX = e.clientX - rect.left
        let mouseY = e.clientY - rect.top

        let zoom = e.deltaY < 0 ? 1.1 : 0.9

        // 🔥 tính offset mới để zoom theo chuột
        offsetX = mouseX - (mouseX - offsetX) * zoom
        offsetY = mouseY - (mouseY - offsetY) * zoom

        scale *= zoom

        draw()

    })

    canvas.addEventListener("dblclick", () => {
        fitImage()
    })

    $(".quick-color").click(function () {

        let rgb = $(this).data("color").split(",").map(Number)

        selectedColor = rgb

        // 🔥 update color picker (sync UI)
        let hex = rgbToHex(rgb[0], rgb[1], rgb[2])
        $("#colorPicker").val(hex)

        // 🔥 auto bật remove tool
        removeMode = true
        eraserMode = false

        $("#removeTool").addClass("bg-red-700")
        $("#eraserTool").removeClass("bg-yellow-700")

    })

    document.addEventListener("keydown", e => {

        if (e.ctrlKey && e.key === "z") {
            e.preventDefault()
            $("#undoBtn").click()
        }

        if (e.ctrlKey && e.key === "y") {
            e.preventDefault()
            $("#redoBtn").click()
        }

    })


    // Space down
    document.addEventListener("keydown", e => {
        if (e.code === "Space") {
            isSpacePressed = true
            canvas.style.cursor = "grab"
        }
        else if (e.key == "{") brushSize++
        else if (e.key == "}") brushSize = Math.max(1, brushSize - 1)
    })

    // Space up
    document.addEventListener("keyup", e => {
        if (e.code === "Space") {
            isSpacePressed = false
            canvas.style.cursor = "default"
        }
    })

    // Color picker
    $("#colorPicker").change(function () {

        selectedColor = hexToRgb($(this).val())

        // 🔥 auto bật remove tool
        removeMode = true
        eraserMode = false

        // (optional) highlight UI
        $("#removeTool").addClass("bg-red-700")
        $("#eraserTool").removeClass("bg-yellow-700")
        showCursor = true


    })

    // Remove tool
    $("#removeTool").click(() => {

        removeMode = true
        eraserMode = false

        $("#removeTool").addClass("bg-red-700")
        $("#eraserTool").removeClass("bg-yellow-700")

    })

    $("#eraserTool").click(() => {

        eraserMode = true
        removeMode = false

        console.log(eraserMode);
        

        $("#eraserTool").addClass("bg-yellow-700")
        $("#removeTool").removeClass("bg-red-700")

    })

    // Undo
    $("#undoBtn").click(() => {
        if (history.length > 1) {
            redoStack.push(history.pop())
            restoreState(history[history.length - 1])
        }
    })

    // Redo
    $("#redoBtn").click(() => {
        if (redoStack.length) {
            let state = redoStack.pop()
            history.push(state)
            restoreState(state)
        }
    })

    // Export
    $("#exportBtn").click(() => {
        console.log(numGlobal);
        showCursor = false
        draw()
        
        let exportCanvas = document.createElement("canvas")
        let exportCtx = exportCanvas.getContext("2d")

        // 🔥 dùng đúng size buffer
        exportCanvas.width = bufferCanvas.width
        exportCanvas.height = bufferCanvas.height

        exportCtx.drawImage(bufferCanvas, 0, 0)
        
        let link = document.createElement('a')
        file_name = "img" + numGlobal + ".png"
        link.download = file_name
        link.href = exportCanvas.toDataURL("image/png")
        link.click()
    })

}

// ================= REMOVE =================

function removeColorCircle(cx, cy) {

    let x = (cx - offsetX) / scale
    let y = (cy - offsetY) / scale

    let radius = brushSize / scale

    let startX = Math.floor(x - radius)
    let startY = Math.floor(y - radius)

    let size = Math.ceil(radius * 2)

    // 🔥 FIX QUAN TRỌNG: clamp bounds
    if (startX < 0) startX = 0
    if (startY < 0) startY = 0
    if (startX + size > bufferCanvas.width) size = bufferCanvas.width - startX
    if (startY + size > bufferCanvas.height) size = bufferCanvas.height - startY

    let imageData = bufferCtx.getImageData(startX, startY, size, size)
    let data = imageData.data

    for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {

            let dx = i - radius
            let dy = j - radius

            if (dx * dx + dy * dy > radius * radius) continue

            let index = (j * size + i) * 4

            let r = data[index]
            let g = data[index + 1]
            let b = data[index + 2]

            let dist = Math.sqrt(
                (r - selectedColor[0]) ** 2 +
                (g - selectedColor[1]) ** 2 +
                (b - selectedColor[2]) ** 2
            )

            if (dist <= colorThreshold) {

                let smooth = 1 - dist / 10
                data[index + 3] *= smooth

            }
        }
    }

    bufferCtx.putImageData(imageData, startX, startY)
}

// ================= UTIL =================

function hexToRgb(hex) {

    let bigint = parseInt(hex.slice(1), 16)

    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255
    ]

}

function drawCursor(x, y) {

    if (!showCursor) return

    ctx.save()

    ctx.beginPath()
    ctx.arc(x, y, brushSize, 0, Math.PI * 2)

    ctx.strokeStyle = "rgba(255,255,255,0.8)"
    ctx.lineWidth = 1

    ctx.stroke()

    ctx.restore()

}

// ================= HISTORY =================

function saveState() {

    history.push(bufferCtx.getImageData(
        0, 0, bufferCanvas.width, bufferCanvas.height
    ))

    if (history.length > 20) history.shift()

}

function restoreState(imageData) {

    bufferCtx.putImageData(imageData, 0, 0)
    draw()

}

function rgbToHex(r, g, b) {

    return "#" + [r, g, b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')

}

function eraseCircle(cx, cy){

    // 👉 chuyển tọa độ canvas → ảnh gốc
    let x = (cx - offsetX) / scale
    let y = (cy - offsetY) / scale

    let radius = brushSize / scale

    let startX = Math.floor(x - radius)
    let startY = Math.floor(y - radius)

    let size = Math.ceil(radius * 2)

    // 👉 tránh out of bounds
    if(startX < 0) startX = 0
    if(startY < 0) startY = 0
    if(startX + size > bufferCanvas.width) size = bufferCanvas.width - startX
    if(startY + size > bufferCanvas.height) size = bufferCanvas.height - startY

    let imageData = bufferCtx.getImageData(startX, startY, size, size)
    let data = imageData.data

    for(let j = 0; j < size; j++){
        for(let i = 0; i < size; i++){

            let dx = i - radius
            let dy = j - radius

            // 👉 chỉ xử lý trong hình tròn
            if(dx*dx + dy*dy > radius*radius) continue

            let index = (j * size + i) * 4

            // 🔥 feather (mịn viền)
            let dist = Math.sqrt(dx*dx + dy*dy)
         
            let feather = 1 - (dist / radius)

            data[index + 3] *= feather

        }
    }

    bufferCtx.putImageData(imageData, startX, startY)
}