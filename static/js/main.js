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

    $("#center_object").on("click", function () {
        let img_number = $("#err_imgNumber").val();

        if (!img_number) {
            alert("⚠ Vui lòng nhập số hình ảnh trước.");
            return;
        }

        $("#err_imageContainer1").html(`<span class="h-full min-h-[20rem] mt-4">Ảnh sau khi xử lý sẽ hiển thị ở đây</span>`)

        $.ajax({
            url: "/center_object",
            method: "POST",
            data: { img_number: img_number },
            success: function (response) {
                if (response.result) {
                    $("#err_imageContainer1").html(
                        `<img src="${response.path_img}" class="w-full rounded-lg shadow-md">`
                    );
                } else {
                    alert("❌ Lỗi: " + response.error);
                }
            },
            error: function () {
                alert("❌ Có lỗi khi gửi yêu cầu căn giữa.");
            }
        });
    });

    function checkImage() {
        let imgNumber = $('#imgNumber').val()
        $.ajax({
            url: '/check_image',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({img_number: imgNumber}),
            success: function (response) {
                if (response.path) {
                    $("#imageContainer, #result").empty()
                    $('#result').text('Hình ảnh được tìm thấy !')
                    $("#imageContainer").append("<img src='" + response.path + "'" + 'width="100%">')
                } else {
                    $("#imageContainer, #result").empty()
                    $('#result').text('Hình ảnh không được tìm thấy !')
                }
            }
        })
    }

    function check_dir() {
        let lastFiveDigits = $("#lastFiveDigits").val();
        console.log(lastFiveDigits);
        

        $.ajax({
            type: "POST",
            url: "/find_directory",
            data: {last_five_digits: lastFiveDigits},
            success: function (response) {
                $("#check_dir_img, #result1").empty()
                $('#result1').text(response.msg)
                $("#check_dir_img").append("<img src='" + response.file_path + "'" + 'width="100%">')
            }
        })
    }

    $("#imgNumber").keypress(function(event) {
        if (event.keyCode === 13) {
            checkImage()
        }
    })
    $("#lastFiveDigits").keypress(function(event) {
        if (event.keyCode === 13) {
            check_dir()
        }
    })

    function setRunningUI(isRunning) {
        if (isRunning) {
            $("#add_more_images").prop("disabled", true).addClass("opacity-50 cursor-not-allowed");
        } else {
            $("#add_more_images").prop("disabled", false).removeClass("opacity-50 cursor-not-allowed");
        }
    }

    $("#add_more_images").click(function () {
        // Đổi màu nút thành xanh lá và thông báo đang xử lý
        $(this).css('background-color', 'green');
        $(this).text('Nào nào, đừng như nước sôi đổ vô trứng cút');

        // Gửi yêu cầu POST đến /process
        $.ajax({
            type: "POST",
            url: "/process",
            success: function (response) {
                const running = s.running || false;
                setRunningUI(running);
                if (response.result === true) {
                    $("#add_more_images").css('background-color', '');

                    // Thêm thông báo vào trang web
                    var notification = $('<div class="alert alert-success"  style="font-size: 30px;color: black;" role="alert">Đã hoàn thành thêm ảnh điện tử</div>');
                    $("#content").append(notification);

                    // Tự động ẩn thông báo sau 3 giây
                    setTimeout(function () {
                        notification.fadeOut('slow', function () {
                            $(this).remove();
                        });
                    }, 3000);
                    $('#add_more_images').text('Thêm ảnh điện tử');
                } else {
                    // Đã có ảnh trong thư mục
                    console.log(response.result);
                    $("#add_more_images").css('background-color', '');

                    // Thêm thông báo vào trang web
                    var notification1 = $('<div class="alert alert-danger"  style="font-size: 30px;color: black;" role="alert">Giống mợ ba Huyền quá, thêm rồi, thêm quàiiiii, yêu Khang rồi "nú nẫn" hà </div>');
                    $("#content").append(notification1);

                    // Tự động ẩn thông báo sau 3 giây
                    setTimeout(function () {
                        notification1.fadeOut('slow', function () {
                            $(this).remove();
                        });
                    }, 3000);
                    $('#add_more_images').text('Thêm ảnh điện tử');

                }
            }
        })
    });

});