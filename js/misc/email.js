﻿/*global Gratzi, utils */

var email = email || {};

(function () {
   "use strict";

   email.sendZi = function (zi, url, callback) {

      var email = {
         "to": zi.recipient.emails[0],
         "from": zi.sender.emails[0],
         "subject": zi.sender.name.formatted + " accepted your gratitude!",
         "message": "You and " + zi.sender.name.formatted + " completed a GratZi!<br/><br/>" +
            "<table><tr><td align='center' width='300' bgcolor='#08c' style='background: #08c; padding-top: 6px; padding-right: 10px; padding-bottom: 6px; padding-left: 10px; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px; color: #fff; font-weight: bold; text-decoration: none; font-family: Helvetica, Arial, sans-serif; display: block;'>" +
            "<a href='" + url +
            "' style='color: #fff; text-decoration: none;'>Click to view and save!</a>" +
            "</td></tr></table>"

      };

      //Email Zi to recipient
      $.post(Gratzi.Servers.email, email,
         function (data) {

            callback(data.token);

         }, "json").fail(function (error) {

            callback("Failure");

         });

   };

   email.sendGrat = function (grat, url, callback) {
      var email = {
         "to": grat.recipient.emails[0],
         "from": grat.sender.emails[0],
         "subject": grat.sender.name.formatted + " sent you gratitude!",
         "message": "You recieved a Grat!<br/><br/>" +
            "<table><tr><td align='center' width='300' bgcolor='#08c' style='background: #08c; padding-top: 6px; padding-right: 10px; padding-bottom: 6px; padding-left: 10px; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px; color: #fff; font-weight: bold; text-decoration: none; font-family: Helvetica, Arial, sans-serif; display: block;'>" +
            "<a href='" + url + "' style='color: #fff; text-decoration: none;'>Click to view and save!</a>" +
            "</td></tr></table>"
      };


      $("#createBtn").html("Emailing...");

      $.post(Gratzi.Servers.email, email,
         function (data) {
            callback(data.token);

         }, "json").fail(function(error){
            callback("Failure");
         });
   };


}());

