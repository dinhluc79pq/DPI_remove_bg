let canvas, ctx

let img = new Image()

let scale = 1
let offsetX = 0
let offsetY = 0

let brushSize = 20
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

let colorThreshold = 35

// ================= INIT =================

function initEditor(src) {

    canvas = document.getElementById("canvas")
    ctx = canvas.getContext("2d")

    resizeCanvas()

    img.onload = function () {

        bufferCanvas.width = img.width
        bufferCanvas.height = img.height

        bufferCtx.drawImage(img, 0, 0)

        fitImage()
        saveState()

    }

    img.src = src

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

    draw()

}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()

    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    ctx.drawImage(bufferCanvas, 0, 0)

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
        let link = document.createElement('a')
        link.download = "output.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
    })

}

// ================= REMOVE =================

function removeColorCircle(cx, cy) {

    // convert về tọa độ ảnh gốc
    let x = (cx - offsetX) / scale
    let y = (cy - offsetY) / scale

    let radius = brushSize / scale

    let size = Math.ceil(radius * 2)

    let imageData = bufferCtx.getImageData(
        Math.floor(x - radius),
        Math.floor(y - radius),
        size,
        size
    )

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

    bufferCtx.putImageData(
        imageData,
        Math.floor(x - radius),
        Math.floor(y - radius)
    )

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