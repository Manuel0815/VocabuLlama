$(document).ready(function () {
    // $("#test").text("Hello, World!");

    $.ajax({
        url: 'words.csv',
        dataType: 'text',
        success: function (data) {
            const rows = data.split('\n');
            const words = rows.map(row => {
                const [word, translation] = row.split(',');
                return { word, translation };
            });
            console.log(words);
        }
    });
});