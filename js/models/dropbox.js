﻿/*global Dropbox, utils, Gratzi */

var drop = drop || {};

(function () {
   'use strict';

   var dropbox = new Dropbox.Client({
      key: "InhyNFQjbJA=|tRdHzxyrdUmc6PfXSK9gyJNbdcR9QNosDrJjoz9B0Q==", sandbox: true
   });

   dropbox.authDriver(new Dropbox.Drivers.Redirect({ rememberUser: true }));


   drop = {

      storeType: "dropbox",

      auth: function (callback) {

         if (localStorage.getItem('authenticated')) {
            //Already authenticated
            dropbox.authenticate({ interactive: false }, function (error) {
               if (error) {
                  console.log("Error authenticating: " + error);
                  callback(showError(error), null);
               }

               localStorage.setItem('authenticated', 'dropbox');

               callback(null, null);
            });
         }

         else {
            //Not yet authenticated
            dropbox.authenticate({ interactive: true }, function (error) {
               if (error) {
                  console.log("Error authenticating: " + error);
                  callback(showError(error), null);
               }

               localStorage.setItem('authenticated', 'dropbox');

               //Load profile
               drop.loadUser(callback);

               //Load Gratzi
               drop.loadGratzi(function (data) {

               });

            });

         }

      },

      loadUser: function (callback) {

         //GET USER INFO
         dropbox.getUserInfo(function (error, userInfo) {
            if (error) {
               return showError(error);  // Something went wrong.
            }

            localStorage.setItem('userid', userInfo.uid);
            localStorage.setItem('email', userInfo.email);

            //GET PROFILE FILE
            var myProfile = "/profile.json";
            dropbox.readFile(myProfile, function (error, stat) {

               if (error) {
                  callback(showError(error), null);
                  return;
               }

               var profile = new Gratzi.Profile();
               profile.load(JSON.parse(stat));

               if (profile.image.indexOf("gratzi.s3") === -1) {

                  //Get public link to profile image
                  //TODO: move this to saveProfile
                  drop.getLink("/images/" + profile.image, function (imageURL) {

                     profile.image = imageURL;

                     callback(null, profile);

                  });
               }
               else {
                  callback(null, profile);
               }


            });

         });

      },

      loadGratzi: function (callback) {

         //GET GRATs
         drop.getFiles("grat", function (data) {

            //console.log(data);
            localStorage.setItem('grats', JSON.stringify(data));

            //GET ZIs
            drop.getFiles("zi", function (data) {
               //console.log(data);
               localStorage.setItem('zis', JSON.stringify(data));
               callback(data);
            });

         });


      },

      saveProfile: function (profile, callback) {

         var filename = "/profile.json";

         //Write profile
         dropbox.writeFile(filename, JSON.stringify(profile), function (error, stat) {
            if (error) {
               return showError(error);  // Something went wrong.
            }


            //Get public link to profile
            drop.getLink(filename, function (profUrl) {

               callback(profUrl);

               //Rewrite profile
               //drop.updateMyProfile(profile, function (path) {
               //  callback(url);
               //});
            });


            //callback(stat.path);
         });

      },


      saveJSONP: function (json, callback) {

         var strJson = JSON.stringify(json).split(')').join("&#41;");
         var filename = json.type + "/" + json.type + "_" + utils.getHash(strJson) + ".json";

         dropbox.writeFile(filename, json.type + "Callback(" + strJson + ")", function (error, stat) {
            if (error) {
               return showError(error);  // Something went wrong.
            }
            else {
               callback(stat.path);
            }
         });

      },

      saveImage: function (image, filename, callback) {

         //Write image
         dropbox.writeFile("/images/" + filename, image, function (error, stat) {
            if (error) {
               callback(showError(error));
            }
            else {
               callback(stat.path);
            }

         });
      },


      getLink: function (path, callback) {

         dropbox.makeUrl(path, { "download": "true", "downloadHack": "true" }, function (error, stat) {

            if (error) {
               return showError(error);  // Something went wrong.
            }

            callback(stat.url);

         });

      },

      getFile: function (filename, callback) {

         var type = filename.split('_')[0];

         dropbox.readFile("/" + type + "/" + filename, function (error, stat) {

            if (error) {
               callback(showError(error), null);
            }
            else {
               callback(JSON.parse(stat.replace(type + "Callback(", "").replace(")", "")));
            }

         });

      },

      getFiles: function (filepart, callback) {

         dropbox.findByName("/" + filepart + "/", filepart, function (error, fileStats) {

            if (error) {
               showError(error);  // Something went wrong.
               callback(files);
            }

            if (fileStats.length > 0) {

               var files = {};
               var counter = 0;

               $.each(fileStats, function (index, value) {

                  dropbox.readFile(fileStats[index].path,
                     function (error, stat) {
                        if (error) {
                           showError(error);  // Something went wrong.
                           callback(files);
                        }
                        console.log("Got file: " + fileStats[index].name);
                        files[fileStats[index].name] = stat.replace(filepart + "Callback(", "").replace(")", "");
                        counter++;

                        if (fileStats.length === counter) {

                           callback(files);
                        }

                     }
                  );

               });

            }


         });
      },

      /*      addBlob: function (grat, callback) {

       utils.json2hashtrix(grat);

       },*/

      logout: function () {
         console.log("Logging out.");
         /*         localStorage.removeItem("username");
          localStorage.removeItem("userid");
          localStorage.removeItem("email");
          localStorage.removeItem('authenticated');
          localStorage.removeItem('profile');
          localStorage.removeItem('grats');
          localStorage.removeItem('zis');*/
         localStorage.clear();
      }

   };


   var showError = function (error) {
      console.log(error.status);
      switch (error.status) {
         case Dropbox.ApiError.INVALID_TOKEN:
            // If you're using dropbox.js, the only cause behind this error is that
            // the user token expired.
            // Get the user through the authentication flow again.
            drop.logout();
            window.location = "/#profile";
            break;

         case Dropbox.ApiError.NOT_FOUND:
            // The file or folder you tried to access is not in the user's Dropbox.
            // Handling this error is specific to your application.
            return "404";

         case Dropbox.ApiError.OVER_QUOTA:
            // The user is over their Dropbox quota.
            // Tell them their Dropbox is full. Refreshing the page won't help.
            break;

         case Dropbox.ApiError.RATE_LIMITED:
            // Too many API requests. Tell the user to try again later.
            // Long-term, optimize your code to use fewer API calls.
            break;

         case Dropbox.ApiError.NETWORK_ERROR:
            // An error occurred at the XMLHttpRequest layer.
            // Most likely, the user's network connection is down.
            // API calls will not succeed until the user gets back online.
            break;

         case Dropbox.ApiError.INVALID_PARAM:
         case Dropbox.ApiError.OAUTH_ERROR:
         case Dropbox.ApiError.INVALID_METHOD:
         default:
         // Caused by a bug in dropbox.js, in your application, or in Dropbox.
         // Tell the user an error occurred, ask them to refresh the page.

      }
   };


   dropbox.onError.addListener(function (error) {

      console.log(error);

   });

})();
