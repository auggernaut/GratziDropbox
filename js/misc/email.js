﻿/*global Gratzi, utils */

var email = email || {};

(function () {
   "use strict";

   email.sendZi = function (zi, url, callback) {

      var email = {
         "to": zi.recipient.emails[0],
         //Email from default if sender doesn't have an email address (e.g. fb account).
         "from": zi.sender.emails[0] ? zi.sender.emails[0] : Gratzi.Client.defaultEmail,
         "subject": zi.sender.name.formatted + " accepted your gratitude!",
         "message": "You and " + zi.sender.name.formatted + " completed a gratzi!<br/><br/>" +
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

            callback("Fail: sendZi");

         });

   };

   email.sendGrat = function (grat, url, callback) {
      var email = {
         "to": grat.recipient.emails[0],
         //Email from default if sender doesn't have an email address (e.g. fb account).
         "from": grat.sender.emails[0] ? grat.sender.emails[0] : Gratzi.Client.defaultEmail,
         "subject": grat.sender.name.formatted + " sent you gratitude!",
         "message": "<h2>You just received one of the first gratzi ever!</h2>"+
            "<br/>Gratzi is a new app for expressing, sharing, and saving gratitude." +
            "<br/><br/>Click the button below to accept your gratitude!<br/><br/>" +
            "<hr/>From: " + grat.sender.name.formatted +  "<br/><br/>" +
            grat.message.substring(0, 200) + "...<br/><br/>" +
            "<table><tr><td align='center' width='300' bgcolor='#08c' style='background: #08c; padding-top: 6px; padding-right: 10px; padding-bottom: 6px; padding-left: 10px; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px; color: #fff; font-weight: bold; text-decoration: none; font-family: Helvetica, Arial, sans-serif; display: block;'>" +
            "<a href='" + url + "' style='color: #fff; text-decoration: none;'>Click to view and save!</a>" +
            "</td></tr></table>"
      };

      $.post(Gratzi.Servers.email, email,
         function (data) {
            callback(data.token);

         }, "json").fail(function(error){
            callback("Fail: sendGrat");
         });
   };

   email.sendFeedback = function (message, callback) {

      var email = {
         "to": Gratzi.Client.defaultEmail,
         "from": Gratzi.Client.defaultEmail,
         "subject": "Feedback",
         "message": message
      };

      $.post(Gratzi.Servers.email, email,
         function (data) {
            callback(data.token);

         }, "json").fail(function(error){
            callback("Fail: sendFeedback");
         });

   };


}());


