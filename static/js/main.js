$(document).ready(function() {

    function checkImage() {
        let imgNumber = $("#err_imgNumber").val();

        if (imgNumber.trim() === "") {
            alert("Vui lòng nhập số hình ảnh!");
            return;
        }

        $.ajax({
            url: "/find_image",
            type: "POST",
            data: { img_number: imgNumber },
            success: function (response) {
                if (response.result) {
                    $("#err_imageContainer").html(
                        `<img src="${response.path_img}" class="w-full rounded-lg shadow-md">`
                    );
                } else {
                    $("#err_imageContainer").html(
                        `<p class="text-red-500">Không tìm thấy hình ảnh!</p>`
                    );
                }
            },
            error: function () {
                $("#err_imageContainer").html(
                    `<p class="text-red-500">Lỗi khi gọi server!</p>`
                );
            }
        });
    }
    // Khi bấm nút
    $("#find_img").click(function (e) {
        e.preventDefault();
        checkImage();
    });

    $("#err_imgNumber").keydown(function(){
        $("#err_imageContainer").html(`<span class="h-full min-h-[20rem] mt-4">Ảnh gốc sẽ hiển thị ở đây</span>`)
        $("#err_imageContainer1").html(`<span class="h-full min-h-[20rem] mt-4">Ảnh sau khi xử lý sẽ hiển thị ở đây</span>`)
    })

    // Khi nhấn Enter trong input
    $("#err_imgNumber").on("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault(); // tránh reload trang
            checkImage();
        }
    });

    $("#remove_bg").click(function (e) {
        e.preventDefault();

        let imgNumber = $("#err_imgNumber").val().trim();

        if (imgNumber === "") {
            alert("Vui lòng nhập số hình ảnh trước khi tách nền!");
            return;
        }

        // Gửi Ajax đến backend xử lý tách nền
        $.ajax({
            url: "/remove_bg",
            type: "POST",
            data: { img_number: imgNumber },
            success: function (response) {
                if (response.result) {
                    $("#err_imageContainer1").html(
                        `<img src="${response.path_img}" class="w-full rounded-lg shadow-md">`
                    );
                } else {
                    $("#err_imageContainer1").html(
                        `<p class="text-red-500">Không thể tách nền cho ảnh này!</p>`
                    );
                }
            },
            error: function () {
                $("#err_imageContainer1").html(
                    `<p class="text-red-500">Lỗi khi gọi server!</p>`
                );
            }
        });
    });

    $("#open_paint3d").on("click", function () {
        let imgNumber = $("#err_imgNumber").val();
        if (imgNumber.trim() === "") {
            alert("Vui lòng nhập số hình ảnh trước!");
            return;
        }

        $.ajax({
            url: "/open_in_paint3d",
            type: "POST",
            data: { img_number: imgNumber },
            success: function (response) {
                if (!response.result) {
                    alert("Không tìm thấy ảnh để mở!");
                }
            }
        });
    });

    $("#remove_extra_bg").click(function () {
        let img_number = $("#err_imgNumber").val();
        if (img_number.trim() === "") {
            alert("Vui lòng nhập số hình ảnh trước!");
            return;
        }

        $("#err_imageContainer1").html(
            `<span class="h-full min-h-[20rem] mt-4">Ảnh sau khi xử lý sẽ hiển thị ở đây</span>`
        );

        $.ajax({
            url: "/crop_border",
            type: "POST",
            data: { img_number: img_number },
            success: function (response) {
                if (response.result) {
                    $("#err_imageContainer1").html(
                        `<img src="${response.path_img}" class="w-full rounded-lg shadow-md">`
                    );
                } else {
                    alert("Không tìm thấy hình ảnh để cắt viền!");
                }
            },
            error: function () {
                alert("Lỗi khi gọi server để cắt viền!");
            }
        });
    });

    $("#remove_extra_bg_2").click(function () {
        let img_number = $("#err_imgNumber").val();
        if (img_number.trim() === "") {
            alert("Vui lòng nhập số hình ảnh trước!");
            return;
        }
        $("#err_imageContainer1").html(
            `<span class="h-full min-h-[20rem] mt-4">Ảnh sau khi xử lý sẽ hiển thị ở đây</span>`
        );

        $.ajax({
            url: "/crop_border_2",
            type: "POST",
            data: { img_number: img_number },
            success: function (response) {
                if (response.result) {
                    $("#err_imageContainer1").html(
                        `<img src="${response.path_img}" class="w-full rounded-lg shadow-md">`
                    );
                } else {
                    alert("Không tìm thấy hình ảnh để cắt viền!");
                }
            },
            error: function () {
                alert("Lỗi khi gọi server để cắt viền!");
            }
        });
    });

    $("#reload_img").click(function () {
        let img_number = $("#err_imgNumber").val();
        if (img_number.trim() === "") {
            alert("Vui lòng nhập số hình ảnh trước!");
            return;
        }

        $.ajax({
            url: "/reload_img",
            type: "POST",
            data: { img_number: img_number },
            success: function (response) {
                if (response.result) {
                    $("#err_imageContainer1").html(
                        `<img src="${response.path_img}" class="w-full rounded-lg shadow-md">`
                    );
                } else {
                    alert("Không tìm thấy ảnh trong thư mục backup!");
                }
            },
            error: function () {
                alert("Lỗi khi gọi server để reload ảnh!");
            }
        });
    });



});