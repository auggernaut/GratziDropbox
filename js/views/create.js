/*global Backbone, Gratzi, _, ga, drop, FB, TDFriendSelector, utils, email */

//************************   CREATE   *************************//
Gratzi.CreateView = Backbone.View.extend({

   events: {
      'click #createBtn': 'createGrat',
      'click #pickfbContact': 'pickfbContact',
      'change #upImage': 'pickImage'
   },

   initialize: function () {
      "use strict";

      console.log('Initializing Create View');
      this.render();
   },

   render: function () {
      "use strict";

      $(this.el).html(this.template({ profile: JSON.parse(localStorage.getItem("profile")) }));
      return this;
   },

   createGrat: function () {
      "use strict";

      var sender, recipient, newGrat;
      var $createBtn = $("#createBtn");
      var profile = JSON.parse(localStorage.getItem("profile"));
      var fId = $('#fbFriendId').val();

      $createBtn.attr("disabled", "disabled");
      $createBtn.html("Creating...");

      recipient = new Gratzi.Profile();
      recipient.userType = fId ? "facebook" : "email";
      recipient.fullName = $('#zName').html();
      recipient.userName = fId ? fId : $('#to').val();
      recipient.email = $('#to').val();
      recipient.image = fId ? $("#zImage").attr("src") : "";

      sender = new Gratzi.Profile();
      sender.userType = Gratzi.Store.storeType;
      sender.fullName = profile.fullname;
      sender.email = sender.userName = profile.email;
      sender.image = $("#gImage").attr("src");

      newGrat = new Gratzi.Grat(
         sender.json(),
         recipient.json(),
         $('#message').val(),
         $('#tags').val()
      );


      //save Grat
      Gratzi.Store.saveJSONP(newGrat.json(), function (path) {

         //Get link to new Grat
         Gratzi.Store.getLink(path, function (url) {

            var gratLink = Gratzi.Servers.fileServer + "/#reply?loc=" + utils.utf8_to_b64(url);

            if (fId) {
               //Facebook message recipient
               FB.ui({
                     method: 'send',
                     name: 'Receive the gratitude!',
                     link: gratLink,
                     to: fId
                  },
                  function (res) {
                     $('#info').show().html("Gratzi sent!");
                     $('#fail').hide();
                     $('#zName').html('');
                     $('#message').val('');
                     $('#tags').val('');

                     $createBtn.removeAttr("disabled");
                     $createBtn.html("Create");
                     $("#zImage").attr("src", "../img/blank-user.jpg");
                     console.log(res);
                  });
            }
            else {

               //email recipient
               email.sendGrat(newGrat.json(), gratLink, function (res) {
                  if (res === "Success") {
                     $('#info').show().html("Gratzi sent!");
                     $('#fail').hide();
                     $('#to').val('');
                     $('#message').val('');
                     $('#tags').val('');

                     $createBtn.removeAttr("disabled");
                     $createBtn.html("Create");
                  } else {
                     $('#fail').show().html("Failed to email.");
                     $createBtn.removeAttr("disabled");
                     $createBtn.html("Create");
                     console.log(res);
                  }
               });


            }

         });

      });

   },

   pickfbContact: function (e) {
      "use strict";

      var selector1, callbackFriendSelected, callbackFriendUnselected, callbackMaxSelection, callbackSubmit;

      // When a friend is selected, log their name and ID
      callbackFriendSelected = function (friendId) {
         var friend, name;
         friend = TDFriendSelector.getFriendById(friendId);
         name = friend.name;
         $("#zName").html(name);
         FB.api("/" + friendId + "/picture?width=180&height=180", function (response) {

            $("#zImage").attr("src", response.data.url);

         });

         console.log('Selected ' + name + ' (ID: ' + friendId + ')');
      };

      // When a friend is deselected, log their name and ID
      callbackFriendUnselected = function (friendId) {
         var friend, name;
         friend = TDFriendSelector.getFriendById(friendId);
         name = friend.name;
         console.log('Unselected ' + name + ' (ID: ' + friendId + ')');
      };

      // When the maximum selection is reached, log a message
      callbackMaxSelection = function () {
         console.log('Selected the maximum number of friends');
      };

      // When the user clicks OK, log a message
      callbackSubmit = function (selectedFriendIds) {
         $("#fbFriendId").val(selectedFriendIds[0]);
         console.log('Clicked OK with the following friends selected: ' + selectedFriendIds.join(", "));
      };

      // Initialise the Friend Selector with options that will apply to all instances
      TDFriendSelector.init({ debug: true });

      // Create some Friend Selector instances
      selector1 = TDFriendSelector.newInstance({
         callbackFriendSelected: callbackFriendSelected,
         callbackFriendUnselected: callbackFriendUnselected,
         callbackMaxSelection: callbackMaxSelection,
         callbackSubmit: callbackSubmit,
         maxSelection: 1,
         friendsPerPage: 5,
         autoDeselection: true
      });


      e.preventDefault();

      FB.getLoginStatus(function (response) {
         if (response.authResponse) {
            selector1.showFriendSelector();
            console.log("Facebook Logged in");
         } else {
            FB.login(function (response) {
               if (response.authResponse) {
                  console.log("Facebook Logged in");
                  selector1.showFriendSelector();
               } else {
                  console.log("Facebook login failed.");
                  //TODO: display message
               }
            }, {});
         }
      });


   },

   pickImage: function () {
      "use strict";

      var files = $('input[id = upImage]')[0].files;
      var file = files[0];
      if (!file || !file.type.match(/image.*/)){return;}

      var $btnPick = $("#btnPickImg");
      $btnPick.attr("disabled", "disabled");
      $btnPick.html("Uploading...");

      Gratzi.Store.saveImage(file, file.name, function (path) {
         console.log("Image Uploaded: " + path);

         Gratzi.Store.getLink(path, function (imgUrl) {
            $('#gImage').attr("src", imgUrl);
            $btnPick.removeAttr("disabled");
            $btnPick.html("Change Image");

         });
      });

   }
});

