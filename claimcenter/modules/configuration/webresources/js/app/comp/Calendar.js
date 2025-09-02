"use strict";

(function(gw) {

    var calendar = {};
    calendar.init = function() {
        updateFilterHidden(gw.globals.gwStorage.get(CALENDAR_FILTERS_HIDDEN_KEY));
    };

    calendar.getSystemName = function() {
        return "calendar";
    };

    gw.api.registerGlobalSystem(calendar);

    var CALENDAR_FILTERS_HIDDEN_KEY = "calendar.filtersHidden";
    var EVENT_PARAM_CALENDAR = "calendar";
    var EVENT_PARAM_ACTIVITY = "activity";

    /**
     * A map to unpack the inline argument strings passed down from the server.
     * Used to identify which arguments are valid on the args obj, since at some point
     * we started sticking a whole bunch of other junk on it in events.js somewhere.
     * @type {{y: string, m: string, t: string, sd: string, wOffset: string, mOffset: string}}
     */
    var tokenKeyMap = {
        y: "year",
        m: "month",
        t: "today",
        sd: "selectedDay",
        wOffset: "weekOffset",
        mOffset: "monthOffset"
    };

    // Server-side methods
    calendar.filter = function(el, args, e) {
        gw.globals.gwUtil.setEventParam(EVENT_PARAM_CALENDAR, args.filter + "=" + el.querySelector('select').value);
        gw.globals.gwUtil.fireEvent(makeEventId(args.id));
    };

    calendar.jumpTo = function(el, args, e) {
        gw.globals.gwUtil.setEventParam(EVENT_PARAM_CALENDAR, el.querySelector('select').value);
        gw.globals.gwUtil.fireEvent(makeEventId(args.id));
    };

    calendar.today = function(el, args, e) {
        gw.globals.gwUtil.setEventParam(EVENT_PARAM_CALENDAR, "clearCalendarState=1");
        gw.globals.gwUtil.fireEvent(makeEventId(args.id));
    };

    calendar.action = function(el, args, e) {
        gw.globals.gwUtil.setEventParam(EVENT_PARAM_ACTIVITY, args.action);
        gw.globals.gwUtil.fireEvent(makeEventId(args.id));
    };

    calendar.day = function(el, args, e) {
        fireTokenKeyMapEvent(el, args, e);
    };

    calendar.week = function(el, args, e) {
       fireTokenKeyMapEvent(el, args, e);
    };

    calendar.month = function(el, args, e) {
        fireTokenKeyMapEvent(el, args, e);
    };

    // Helper Methods
    var fireTokenKeyMapEvent = function(el, args, e) {
        gw.globals.gwUtil.setEventParam(EVENT_PARAM_CALENDAR, tokenizeArgs(args));
        gw.globals.gwUtil.fireEvent(makeEventId(args.id));
    };

    var tokenizeArgs = function(argsObj) {
        var keys = Object.keys(argsObj);
        var tokens = [];
        for (var i = 0; i < keys.length; i++) {
            if (!tokenKeyMap.hasOwnProperty(keys[i])) {
                continue;
            }
            var finalValue = argsObj[keys[i]];
            var finalKey = tokenKeyMap[keys[i]];
            tokens.push(finalKey + "=" + finalValue);
        }

        return tokens.join("&");
    };

    var makeEventId = function(id) {
        return id + "_act";
    };

    // Client-side Methods
    calendar.toggleFilters = function(el, args, e) {
        updateFilterHidden(gw.storage.toggleFlag(CALENDAR_FILTERS_HIDDEN_KEY));
    };

    calendar.toggleDay = function(el, args, e) {
        var day = gw.globals.gwUtil.getSelfOrFirstParentWithClass(el, "gw-CalendarWeek--day");
        gw.globals.gwUtil.toggleClass(day, "gw-closed");

        day.setAttribute("aria-expanded", (!gwUtil.hasClass(day, "gw-closed")).toString());
    };

    // NOTE: toggling individual events exists in Ferrite but was disabled for Granite.  There's a note
    // stating the code was left in place on the server side so leaving the client side hook in place as well.
    calendar.toggleEvent = function(el, args, e) {
        var event = gw.globals.gwUtil.getSelfOrFirstParentWithClass(el, "gw-CalendarWeek--event--inner");
        gw.globals.gwUtil.toggleClass(event, "gw-closed");

        event.setAttribute("aria-expanded", (!gwUtil.hasClass(day, "gw-closed")).toString());
    };

    // Prefs and storage
    var updateFilterHidden = function(bool) {
        gw.globals.gwUtil.conditionalAddRemoveClass(bool, ".gw-CalendarFilters", "gw-hidden");
    };

}(gw));