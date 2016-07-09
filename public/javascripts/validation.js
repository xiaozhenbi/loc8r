$('#addReview').submit(function () {
    var alertText = $('.alert.alert-danger');
    alertText.hide();
    if (!$('input#name').val() || !$('select#rating').val() ||
        !$('textarea#review').val()) {
        if (alertText.length) {
            alertText.show();
        } else {
            $(this).prepend('<div role="alert" class="alert alert-danger">All fields required, please try again</div>');
        }
        return false;
    }
});