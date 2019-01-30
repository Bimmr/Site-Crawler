const regexStyle = new RegExp(/(?<=<[^>]+([^>]+stylesheet[^>]+)[^>]+href\s{0,2}=\s{0,2}["\']{0,1})(([^"\']*)(\.css))(?=[^&?]["\']*[^>]*>)|(?<=<[^>]+href\s{0,2}=\s{0,2}["\']{0,1})(([^"\']*)(\.css))(?=[^&?]["\']*[^>]+stylesheet[^>]*>)/g),
    regexScript = new RegExp(/(?<=<[^>]+([^>]+)[^>]+src\s{0,2}=\s{0,2}["\']{0,1})(([^"\']*)(\.js))(?=[^&?p]["\']*[^>]*>)|(?<=<[^>]+src\s{0,2}=\s{0,2}["\']{0,1})(([^"\']*)(\.js))(?=[^&?p]["\']*[^>]*>)/g),
    regexImg = new RegExp(/(?<=<img[^>]+src\s{0,2}=\s{0,2}["\']{0,1})([^"\']+){2,}(?=["\']{0,1}[^>]*>)/g),
    regexUrl = new RegExp(/(?<=background[^\)]+url\s{0,2}\(\s{0,2}["\']{0,1})([^"\']+)(?=["\']{0,1}[^\)]+\))/g);


const iconLoading = '<i class="fas fa-circle-notch"></i>',
    iconCrawl = '<i class="purple fas fa-expand"></i>',
    iconDownload = '<i class="green fas fa-download"></i>',
    iconBroken = '<i class="red fas fa-times-circle"></i>',
    iconCheck = '<i class="green fas fa-check"></i>',
    iconQuestion = '<i class="purple fas fa-question"></i>',
    iconMore = '<i class="blue fas fa-ellipsis-v"></i>',
    iconLink = '<i class="fas fa-link"></i>',
    iconPDF = '<i class="fas fa-file-pdf"></i>',
    iconWord = '<i class="fas fa-file-word"></i>',
    iconEnvelope = '<i class="fas fa-envelope"></i>';
