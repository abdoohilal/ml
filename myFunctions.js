$(document).ready(function () {

    // 1. إظهار نموذج الحجز عند الضغط على "متابعة"
    $("#btn-continue").click(function () {
        $("#booking-form-section").slideDown();
    });

    // 2. إظهار/إخفاء تفاصيل السيارة
    $(".detail-trigger").change(function () {
        var carId = $(this).val();
        if (this.checked) {
            $("#details-" + carId).fadeIn();
        } else {
            $("#details-" + carId).fadeOut();
        }
    });

    // ===== دوال مساعدة للتحقق من التاريخ =====
    function isValidDateFormat(str) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
        var p = str.split("-");
        var y = parseInt(p[0], 10);
        var m = parseInt(p[1], 10);
        var d = parseInt(p[2], 10);
        if (m < 1 || m > 12) return false;
        var daysInMonth = new Date(y, m, 0).getDate();
        return d >= 1 && d <= daysInMonth;
    }

    function parseDateUTC(str) {
        var p = str.split("-");
        return Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    }

    // ===== التحقق عند إرسال النموذج =====
    $("#rental-form").submit(function () {

        // [1] الاسم: اختياري، لكن إن وُجد يجب أن يكون أحرفًا عربية فقط
        var fullName = $("#full-name").val().trim();
        var arabicPattern = /^[\u0621-\u064A\s]+$/;
        if (fullName !== "" && !arabicPattern.test(fullName)) {
            alert("خطأ: الاسم الكامل يجب أن يحتوي على أحرف عربية فقط!");
            return false;
        }

        // [2] الرقم الوطني: إلزامي، 11 رقمًا فقط
        var nationalId = $("#national-id").val().trim();
        if (!/^\d{11}$/.test(nationalId)) {
            alert("خطأ: الرقم الوطني إلزامي ويجب أن يتكون من 11 رقمًا فقط!");
            return false;
        }

        // [3] التواريخ: إلزامية + تحقق من الصيغة + تحقق من التسلسل الزمني
        var startDateStr = $("#start-date").val().trim();
        var endDateStr = $("#end-date").val().trim();

        if (startDateStr === "" || endDateStr === "") {
            alert("خطأ: تاريخا البداية والنهاية إلزاميان!");
            return false;
        }
        if (!isValidDateFormat(startDateStr)) {
            alert("خطأ: صيغة تاريخ البداية غير صحيحة، يجب أن تكون yyyy-mm-dd!");
            return false;
        }
        if (!isValidDateFormat(endDateStr)) {
            alert("خطأ: صيغة تاريخ النهاية غير صحيحة، يجب أن تكون yyyy-mm-dd!");
            return false;
        }

        var startMs = parseDateUTC(startDateStr);
        var endMs = parseDateUTC(endDateStr);

        if (endMs <= startMs) {
            alert("خطأ: تاريخ نهاية التأجير يجب أن يكون بعد تاريخ البداية!");
            return false;
        }

        var totalDays = Math.round((endMs - startMs) / (1000 * 3600 * 24));

        // [4] الموبايل: اختياري، لكن إن وُجد يجب أن يكون سوريًا صحيحًا
        var mobileNumber = $("#mobile-number").val().trim();
        var mobilePattern = /^09(3|4|5|6|8|9)\d{7}$/;
        if (mobileNumber !== "" && !mobilePattern.test(mobileNumber)) {
            alert("خطأ: رقم الموبايل غير صحيح! يجب أن يبدأ بـ 09 ويتكون من 10 أرقام (Syriatel أو MTN).");
            return false;
        }

        // [5] الإيميل: اختياري، لكن إن وُجد يجب أن يكون بصيغة صحيحة
        var email = $("#email-address").val().trim();
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (email !== "" && !emailPattern.test(email)) {
            alert("خطأ: البريد الإلكتروني غير صحيح!");
            return false;
        }

        // [6] جمع السيارات المختارة وحساب السعر اليومي
        var prices = {
            "CR-001": 250000,
            "CR-002": 400000,
            "CR-003": 300000,
            "CR-004": 180000,
            "CR-005": 350000
        };

        var selectedCarsCodes = [];
        var totalPricePerDay = 0;

        $(".select-car:checked").each(function () {
            var code = $(this).val();
            selectedCarsCodes.push(code);
            if (prices[code]) {
                totalPricePerDay += prices[code];
            }
        });

        if (selectedCarsCodes.length === 0) {
            alert("خطأ: يرجى اختيار سيارة واحدة على الأقل من الجدول!");
            return false;
        }

        // [7] الحسابات المالية
        var totalBeforeDiscount = totalPricePerDay * totalDays;
        var discountAmount = 0;
        var discountMessage = "لا يوجد (المدة أقل من أو تساوي 7 أيام)";

        if (totalDays > 7) {
            discountAmount = totalBeforeDiscount * 0.10;
            discountMessage = "تم تطبيق خصم 10% لتجاوز الحجز مدة 7 أيام";
        }

        var finalCost = totalBeforeDiscount - discountAmount;

        // [8] بناء تقرير الحجز النهائي
        var report = "تقرير طلب الحجز الإلكتروني:\n\n";
        if (fullName !== "") report += "الاسم الكامل: " + fullName + "\n";
        report += "الرقم الوطني: " + nationalId + "\n";
        if (mobileNumber !== "") report += "رقم الموبايل: " + mobileNumber + "\n";
        if (email !== "") report += "البريد الإلكتروني: " + email + "\n";
        report += "\nالسيارات المحجوزة:\n";
        for (var i = 0; i < selectedCarsCodes.length; i++) {
            var c = selectedCarsCodes[i];
            report += " - " + c + ": " + totalDays + " أيام (" + prices[c].toLocaleString() + " ل.س/يوم)\n";
        }
        report += "\nعدد أيام التأجير الإجمالي: " + totalDays + " يوم\n";
        report += "مجموع السعر اليومي للسيارات: " + totalPricePerDay.toLocaleString() + " ل.س\n";
        report += "المبلغ قبل الخصم: " + totalBeforeDiscount.toLocaleString() + " ل.س\n";
        report += "قيمة الخصم: " + (discountAmount > 0 ? discountAmount.toLocaleString() + " ل.س" : "0 ل.س") + "\n";
        report += "حالة الخصم: " + discountMessage + "\n";
        report += "المبلغ النهائي المستحق: " + finalCost.toLocaleString() + " ل.س";

        alert(report);
        return false; // منع الإرسال الفعلي
    });
});