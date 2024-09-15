// **DO THIS**:
//   Replace BUCKET_NAME with the bucket name.
//
var albumBucketName = "warot-photo-demo-2024-aug";
var cloudFrontURL = "https://dd011aimb8x2b.cloudfront.net/";

// **DO THIS**:
//   Replace this block of code with the sample code located at:
//   Cognito -- Manage Identity Pools -- [identity_pool_name] -- Sample Code -- JavaScript
//
// Initialize the Amazon Cognito credentials provider
AWS.config.region = "ap-southeast-1"; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: "ap-southeast-1:c87a122e-f14a-4ef6-895e-ca679f4244c7",
});

// Create a new service object
var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName },
});

// A utility function to create HTML.
function getHtml(template) {
  return template.join("\n");
}

// List the photo albums that exist in the bucket.
async function GenAlbumThumb(albumName) {
  var albumPhotosKey = encodeURIComponent(albumName) + "/";
  albumKeyParams = { Prefix: albumPhotosKey }
  const prefixResponse = await s3.listObjects(albumKeyParams).promise();
  var contentList = prefixResponse.Contents;
  //console.log(prefixResponse)
  //console.log(contentList)
  var allURL = [];
  const keyLen = contentList.length;
  const randomIndex = 1 + Math.floor(Math.random() * (keyLen-1));
  //console.log(randomIndex);
  var maxLastModified = 0;
  contentList.forEach(content => {
    var photoKey = content.Key;
    var photoUrl = cloudFrontURL + photoKey;
    allURL.push(photoUrl);
    if (content.LastModified > maxLastModified) {
      maxLastModified = content.LastModified;
    }
  })
  const randomURL = allURL[randomIndex];
  const thumbNailDiv = viewThumbnail(randomURL, albumName, maxLastModified);
  return thumbNailDiv;
}
async function listAlbums() {
  try {
    var albumTemplate = [];
    listParams = { Delimiter: "/" };
    const bucketResponse = await s3.listObjects(listParams).promise();
    var commonPrefixes = bucketResponse.CommonPrefixes
    console.log(commonPrefixes)
    for (const prefixObj of commonPrefixes) {
      prefix = prefixObj.Prefix;
      if (prefix != "assets/" && prefix != ".git/") {
        var albumName = decodeURIComponent(prefix.replace("/", ""));
        const thumbDiv =  await GenAlbumThumb(albumName);
        for (const line of thumbDiv) {
          albumTemplate.push(line);
        }
      }
    };
    //console.log(albumTemplate);
    var message = commonPrefixes.length
          ? getHtml(["<p>Click on an album name to view it.</p>"])
          : "<p>You do not have any albums. Please Create album.";
    var htmlTemplate = [
      "<h2>Albums</h2>",
      message,
      '<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">',    
      getHtml(albumTemplate),
      "</div>"
    ];
    document.getElementById("viewer").innerHTML = getHtml(htmlTemplate);
  } catch (err) {
    return alert("There was an error listing your albums: " + err.message);
  }
}

function viewThumbnail(imgURL, albumName, maxLastModified) {
  return [
    '<div class="col">',
    '<div class="card shadow-sm">',
    '<div class="card-img-top">',
    '<div class="ratio ratio-16x9">',
    '<img class="card-cover" src=\''+imgURL+'\'>',
    '</div>',
    '</div>',
    '<div class="card-body">',
    '<p class="card-text">Album Name: </p>',
    '<h2 class="strong">'+ albumName +'</h2>',
    '<div class="d-flex justify-content-between align-items-center">',
    '<div class="btn-group pt-2">',
    '<button type="button" class="btn btn-sm btn-outline-primary" onclick="viewAlbum(\''+albumName +'\')">View</button>',
    '</div>',
    '<small class="text-body-secondary text-sm-end">' + maxLastModified.toDateString() + '</small>',
    '</div>',
    '</div>',
    '</div>',
    '</div>'
  ];
}
  // Show the photos that exist in an album.
function viewAlbum(albumName) {
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
    s3.listObjects({ Prefix: albumPhotosKey }, function (err, data) {
      if (err) {
        return alert("There was an error viewing your album: " + err.message);
      }
      // 'this' references the AWS.Request instance that represents the response
      //var href = this.request.httpRequest.endpoint.href;
      //var bucketUrl = href + albumBucketName + "/";
      
      var photos = data.Contents.map(function (photo) {
        var photoKey = photo.Key;
        var photoName = photoKey.replace(albumPhotosKey, "");
        var photoUrl = cloudFrontURL + albumName + '/' + photoName;
        if (photoName != "") {
          return getHtml([
            '<div class="col-sm-4">',
            '<div class="card shadow-sm">',
            '<img class="card-cover card-img-top" src=\''+photoUrl+'\'>',
            '<div class="card-body">',
            '<div class="d-flex justify-content-between align-items-center">',
            '<div class="btn-group btn-group-sm float-right" rle="group">',
            '<button type="button" class="btn btn-sm btn-primary" onclick="downloadImage(\''+photoUrl+'\',\''+photoName+'\');">',
            '<i class="bi bi-cloud-download"></i>',
            '<button type="button" class="btn btn-sm btn-secondary" onclick="openImageInNewTab(\''+photoUrl+'\',\''+photoName+'\');">',
            '<i class="bi bi-eye"></i>',
            '</button>',
            '</div>',
            '<small class="text-body text-sm-end">' + photoName + '</small>',
            '</div>',
            '</div>',
            '</div>',
            '</div>'
          ]);
        }
      });
      var message = photos.length
        ? "<p>The following photos are present.</p>"
        : "<p>There are no photos in this album.</p>";
      var htmlTemplate = [
        "<div>",
        '<button type="button" class="btn btn-outline-primary" onclick="listAlbums()">Back To Albums</button>',
        '<button type="button" class="btn btn-success" onclick="downloadImage(\''+cloudFrontURL + albumName + '.zip\');">Download Albums</button>',
        "</div>",
        "<h2 class='pt-3'>",
        "Album: " + albumName,
        "</h2>",
        message,
        '<div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-2">',
        getHtml(photos),
        "</div>",
        '<div class="pt-3">',
        '<button type="button" class="btn btn-outline-primary" onclick="listAlbums()">Back To Albums</button>',
        '<button type="button" class="btn btn-success" onclick="downloadImage(\''+cloudFrontURL + albumName + '.zip\');">Download Albums</button>',
        "</div>",
      ];
      document.getElementById("viewer").innerHTML = getHtml(htmlTemplate);
    });
  }
  
  // A function to download img from CloudFront
  function downloadImage(url, filename) {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(console.error);
  }
  
  // A Function to open Img URL in new tab.
  function openImageInNewTab(url) {
    window.open(url, '_blank');
  }