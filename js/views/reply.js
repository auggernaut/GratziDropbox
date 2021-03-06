/*global Backbone, Gratzi, _, ga, drop, email, utils, s3 */

//*********************JSONP CALLBACKS***********************//

function gratCallback(json) {
   "use strict";

   localStorage.setItem("jGrat", JSON.stringify(json));

   var sender = new Gratzi.Profile();
   sender.load(json.sender);

   var recipient = new Gratzi.Profile();
   recipient.load(json.recipient);

   $('#gName').append(sender.fullName);
   $('#gMessage').append(json.message);
   $('#gTags').append(json.tags);
   $('#gImage').attr("src", sender.image);
   $('#saveForm').hide();


   if (recipient.image) {
      $('#zImage').attr('src', recipient.image);
   }

   if(json.image){
      $('#imgGratImg').attr('src', json.image);
   }

   if (recipient.fullName) {
      // Grat created with Facebook photo
      $('#zName').html(recipient.fullName);
      $('#fullname').val(recipient.fullName);
      $('#fullname').css('display', 'none');
   } else if (localStorage.getItem('authenticated')) {
      // If not, and the user it logged in, use their profile info
      var profile = new Gratzi.Profile();
      profile.load(JSON.parse(localStorage.getItem('profile')));
      $('#zName').html(profile.fullName);
      $('#imgProfImg').attr("src", profile.image);
      $('#fullname').css('display', 'none');
   }
   else {
      // Else, just show the email the grat was sent to in name field
      $('#zName').html(recipient.email);
   }


}

function ziCallback(json) {
   "use strict";

   localStorage.setItem("jZi", JSON.stringify(json));


   if (localStorage.getItem('authenticated')) {

      var sender = new Gratzi.Profile();
      sender.load(json.sender);

      $('#fullname').hide();
      $('#response').hide();
      $('#tags').hide();
      $('#btnZiImg').hide();
      $('#btnSend').hide();

      $('#zName').append(sender.fullName);
      $('#zMessage').append(json.message);
      $('#zTags').append(json.tags);
      $('#imgProfImg').attr("src", sender.image);
      $('#imgZiImg').attr("src", json.image);


      $('#sendForm').hide();
      //$('#auth').hide();
      $('#grat').show();

      var gLink = json.grat;
      var index = gLink.lastIndexOf("/");
      var gFileName = gLink.substr(index + 1);

      Gratzi.Store.getFile(gFileName, function (file) {

         var recipient = new Gratzi.Profile();
         recipient.load(file.sender);

         $('#gName').append(recipient.fullName);
         $('#gMessage').append(file.message);
         $('#gTags').append(file.tags);
         $('#gImage').attr("src", recipient.image);
         $('#imgGratImg').attr("src", file.image);
      });

   }
   else {
      $('#reply').hide();
      $('#auth').show();
      $('#gName').append("Login to view Grat.");
      $('#sendForm').hide();
   }


}


//*********************  REPLY   ***************************//
Gratzi.ReplyView = Backbone.View.extend({

   events: {
      "click #btnSend": "sendZi",
      "click #btnSave": "saveZi",
      /*"change #upImage": "uploadToImgur",*/
      "click #dropbox": "authDropBox",
      'change #upProfImg': 'pickImage',
      'change #upZiImg': 'pickImage',
      'change #fullname': 'changeName',
      'click #zName': 'changeName',
      'change #response': 'changeResponse',
      'click #zMessage': 'changeResponse',
      'change #tags': 'changeTags',
      'click #zTags': 'changeTags'
   },

   initialize: function () {
      "use strict";
      console.log('Initializing Reply View');
      this.render();
   },

   render: function () {
      "use strict";
      var cbScript, url;

      if (this.options && (this.options.loc)) {
         url = utils.b64_to_utf8(this.options.loc);

         //JSONP Callback
         cbScript = "<script type='text/javascript' src='" + url + "'></script>";

         localStorage.setItem("loc", this.options.loc);
      }


      if (!localStorage.getItem('authenticated')) {
         //If not logged in send to S3.
         Gratzi.Store = s3;
      }

      $(this.el).html(this.template({ script: cbScript }));
      return this;

   },

   authDropBox: function () {
      "use strict";

      ga('send', {
         'hitType': 'event',
         'eventCategory': 'button',
         'eventAction': 'click',
         'eventLabel': 'authDropBoxZi',
         'eventValue': 1
      });

      Gratzi.Store = drop;
      Gratzi.Store.auth();

   },


   sendZi: function () {
      "use strict";

      ga('send', {
         'hitType': 'event',
         'eventCategory': 'button',
         'eventAction': 'click',
         'eventLabel': 'sendZi',
         'eventValue': 1
      });

      var $btnSend = $("#btnSend");
      var jGrat = JSON.parse(localStorage.getItem("jGrat"));
      var sender, recipient, newZi;


      $btnSend.attr("disabled", "disabled");
      $btnSend.html("Sending...");

      sender = new Gratzi.Profile();
      sender.load(jGrat.recipient);
      sender.fullName = $('#zName').html();
      sender.image = $("#imgProfImg").attr("src");

      recipient = new Gratzi.Profile();
      recipient.load(jGrat.sender);

      newZi = new Gratzi.Zi(
         sender.json(),
         recipient.json(),
         localStorage.getItem("loc"),
         $('#response').val(),
         $('#tags').val(),
         $('#imgZiImg').attr("src")
      );

      //Save Grat
      Gratzi.Store.saveJSONP(jGrat, function (gPath) {

         console.log("Grat stored: " + gPath);

         var jZi = newZi.json();

         //Save Zi
         Gratzi.Store.saveJSONP(jZi, function (res) {

            if (res === "Failure") {

               $('#fail').show().html("Failed to save Zi.");
               $btnSend.removeAttr("disabled");
               $btnSend.html("Send");

            } else {

               //Get Public Link to new Zi
               Gratzi.Store.getLink(res, function (url) {

                  var loc = utils.utf8_to_b64(url);
                  var ziLink = Gratzi.Servers.fileServer + "/#reply?loc=" + loc;

                  //Email Grat creator
                  email.sendZi(jZi, ziLink, function (res) {
                     if (res === "Success") {
                        $btnSend.removeAttr("disabled");
                        $btnSend.html("Send");
                        $('#info').show().html("Zi sent!");
                        $('#fail').hide();
                        $('#zMessage').html($('#response').val());
                        $('#zTags').html($('#tags').val());
                        $('#btnZiImg').hide();

                        $('#sendForm').hide();
                        $btnSend.hide();

                        if (!localStorage.getItem('authenticated')) {
                           localStorage.setItem("profile", JSON.stringify(sender.json()));
                           localStorage.setItem("jZi", JSON.stringify(jZi));
                           localStorage.setItem("loc", loc);
                           $('#divDB').show();
                        }
                     }
                     else {
                        $('#fail').show().html("Failed to email Zi.");
                        $btnSend.removeAttr("disabled");
                        $btnSend.html("Send");
                     }
                  });

               });
            }

         });
      });
   },


   saveZi: function () {
      "use strict";

      ga('send', {
         'hitType': 'event',
         'eventCategory': 'button',
         'eventAction': 'click',
         'eventLabel': 'saveZi',
         'eventValue': 1
      });

      var $btnSave = $("#btnSave");
      $btnSave.attr("disabled", "disabled");
      $btnSave.html("Saving...");

      var jZi = JSON.parse(localStorage.getItem("jZi"));

      if (localStorage.getItem('authenticated')) {

         //Store Grat
         Gratzi.Store.saveJSONP(jZi, function (path) {
            console.log("Zi stored: " + path);
            $('#saveForm').hide();
            $('#info').show().html("Zi Saved!");

            //TODO: add new grat to grats in localStorage
         });

      } else {
         //Redirect to login
         window.location.href = "/#profile";
      }

   },

   pickImage: function (e) {
      "use strict";

      var idPart = e.currentTarget.id.split('up')[1];

      ga('send', {
         'hitType': 'event',
         'eventCategory': 'button',
         'eventAction': 'click',
         'eventLabel': 'up' + idPart,
         'eventValue': 1
      });

      var files = $('input[id = \'up' + idPart + '\']')[0].files;
      var file = files[0];
      if (!file || !file.type.match(/image.*/)) {
         return;
      }

      var $btnPick = $("#btn" + idPart);
      if ($btnPick) {
         $btnPick.attr("disabled", "disabled");
         $btnPick.html("Uploading...");
      }

      Gratzi.Store.saveImage(file, file.name, function (path) {
         console.log("Image Uploaded: " + path);

         Gratzi.Store.getLink(path, function (imgUrl) {
            $('#img' + idPart).attr("src", imgUrl);

            if ($btnPick) {
               //$btnPick.removeAttr("disabled");
               //$btnPick.html("Change Image");
               $btnPick.hide();
            }

         });
      });
   },

   changeName: function (e) {
      "use strict";

      var val = $(e.currentTarget).val();
      $("#zName").html(val);

      if (e.currentTarget.id === "fullname") {
         val = $(e.currentTarget).val();
         $("#zName").html(val);
         $("#fullname").hide();
         $("#zName").show();
      } else {
         $("#fullname").show();
         $("#zName").hide();

      }

   },

   changeResponse: function (e) {
      "use strict";

      var val;

      if (e.currentTarget.id === "response") {
         val = $(e.currentTarget).val();
         $("#zMessage").html(val.replace(/\n/g, "<br />"));
         $("#response").hide();
         $("#zMessage").show();
      } else {
         $("#response").show();
         $("#zMessage").hide();
      }
   },

   changeTags: function (e) {
      "use strict";

      var val;

      $("#message").hide();
      $("#zMessage").show();

      if (e.currentTarget.id === "tags") {
         val = $(e.currentTarget).val();
         $("#zTags").html(val);
         $("#tags").hide();
         $("#zTags").show();
      } else {
         $("#tags").show();
         $("#zTags").hide();
      }
   },


   uploadToImgur: function () {
      "use strict";

      //ADD IMAGE
      //http://hacks.mozilla.org/2011/03/the-shortest-image-uploader-ever/
      var files = $('input[id = upImage]')[0].files;
      var file = files[0];
      if (!file || !file.type.match(/image.*/)) {
         return;
      }

      var fd = new FormData();
      fd.append("image", file);
      fd.append("type", "file");
      fd.append("name", "test");
      fd.append("description", "tests");

      var xhr = new XMLHttpRequest();

      xhr.open("POST", "https://api.imgur.com/3/image"); // Boooom!
      xhr.setRequestHeader("Authorization", "Client-ID 0ea1384c01b6dcf");
      xhr.onload = function () {
         var url = JSON.parse(xhr.responseText).data.link;
         $("#zImage").attr("src", url);
      };
      xhr.send(fd);

   }


})
;
