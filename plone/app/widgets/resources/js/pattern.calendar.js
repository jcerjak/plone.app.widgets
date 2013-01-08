// plone integration for pickadate.
//
// Author: Rok Garbas
// Contact: rok@garbas.si
// Version: 1.0
// Depends:
//    ++resource++plone.app.jquery.js
//
// Description:
//
// License:
//
// Copyright (C) 2010 Plone Foundation
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation; either version 2 of the License.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program; if not, write to the Free Software Foundation, Inc., 51
// Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//

/*jshint bitwise:true, curly:true, eqeqeq:true, immed:true, latedef:true,
  newcap:true, noarg:true, noempty:true, nonew:true, plusplus:true,
  undef:true, strict:true, trailing:true, browser:true, evil:true */
/*global jQuery:false */


(function($, Patterns, undefined) {
"use strict";

var Calendar = Patterns.Base.extend({
  name: 'calendar',
  jqueryPlugin: 'patternCalendar',
  defaults: {
    klassWrapper: 'pattern-calendar',
    klassIcon: 'pattern-calendar-icon',
    format: 'd-mmmm-yyyy@HH:MM',
    formatSubmit: 'yyyy-m-d H:M',
    showAMPM: true,
    AMPM: ['AM', 'PM'],
    minuteStep: '5'
  },
  init: function($el, options) {
    var self = this;

    self.options = $.extend({}, self.defaults, options);

    self.pickadateOptions = $.extend({}, $.fn.pickadate.defaults, {
      monthSelector: true,
      yearSelector: true
    }, Patterns.getOptions(self.$el, 'pickadate'), {
      formatSubmit: 'yyyy-mm-dd',
      onOpen: function() {},
      onClose: function() {},
      onSelect: function(e) {
        var date = this.getDate('yyyy-mm-dd').split('-');
        self.$years.val(parseInt(date[0], 10));
        self.$months.val(parseInt(date[1], 10));
        self.$days.val(parseInt(date[2], 10));
        self.setDate(
          self.$years.val(),
          self.$months.val(),
          self.$days.val(),
          self.$hours.val(),
          self.$minutes.val(),
          self.$ampm.val()
        );
      }
    });

    self.$el.hide();

    self.$wrapper = $('<div/>')
      .addClass(self.options.klassWrapper)
      .appendTo(self.$el.parent());

    self.pickadate = $('<input/>')
      .hide().appendTo(self.$wrapper)
      .pickadate(self.pickadateOptions).data('pickadate');

    function changePickadateDate() {
      if (self.$years.val() !== '' &&
          self.$months.val() !== '' &&
          self.$days.val() !== '') {
        self.pickadate.setDate(
            parseInt(self.$years.val(), 10),
            parseInt(self.$months.val(), 10),
            parseInt(self.$days.val(), 10),
            true);
      }
      self.setDate(
        self.$years.val(),
        self.$months.val(),
        self.$days.val(),
        self.$hours.val(),
        self.$minutes.val(),
        self.$ampm.val()
      );
    }

    self.$years = $('<select/>').on('change', changePickadateDate);
    self.$months = $('<select/>').on('change', changePickadateDate);
    self.$days = $('<select/>').on('change', changePickadateDate);
    self.$hours = $('<select/>').on('change', changePickadateDate);
    self.$minutes = $('<select/>').on('change', changePickadateDate);
    self.$icon = $('<span class="' + self.options.klassIcon + '"/>')
      .on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        self.toggle();
      });

    // append elements in correct order according to self.options.format
    $.each(self._strftime(self.options.format,
      function(format) {
        switch (format) {
          case 'yy':
          case 'yyyy':
            return self.$years.append(self._getYears(format));
          case 'm':
          case 'mm':
          case 'mmm':
          case 'mmmm':
            return self.$months.append(self._getMonths(format));
          case 'd':
          case 'dd':
          case 'ddd':
          case 'dddd':
            return self.$days.append(self._getDays(format));
          case 'H':
          case 'HH':
            return self.$hours.append(self._getHours(format));
          case 'M':
          case 'MM':
            return self.$minutes.append(self._getMinutes(format));
          case '@':
            return self.$icon;
          default:
            return $('<span> ' + format + ' </span>');
        }
      }
    ), function(i, $item) {
      self.$wrapper.append($item);
    });

    self.$ampm = $('<select/>')
      .append(self._getAMPM())
      .on('change', changePickadateDate);
    if (self.options.showAMPM) {
      self.$wrapper.append($('<span> </span>'));
      self.$wrapper.append(self.$ampm);
    }

    // populate dropdowns and calendar
    // TODO: should be done with self._strtime
    if (self.$el.val() !== '') {
      var tmp = self.$el.val().split(' '),
          date = tmp[0].split('-'),
          time = tmp[1].split(':'),
          ampm = (parseInt(time[0], 10) >= 12) && 'PM' || 'AM';
      time[0] -= (parseInt(time[0], 10) >= 12) && 12 || 0;
      self.setDate(
          date[0], date[1], date[2],
          time[0], time[1], ampm
          );
      self.$years.val('' + parseInt(date[0], 10));
      self.$months.val('' + parseInt(date[1], 10));
      self.$days.val('' + parseInt(date[2], 10));
      self.$hours.val('' + parseInt(time[0], 10));
      self.$minutes.val('' + parseInt(time[1], 10));
      self.$ampm.val(ampm);
    }
  },
  _strftime: function(format, action, options) {
    var self = this, result = [];
    // Rule   | Result                    | Example
    // -------+---------------------------+--------------
    // yy     | Year - short              | 00-99
    // yyyy   | Year - full               | 2000-2999
    // m      | Month                     | 1-12
    // mm     | Month with leading zero   | 01-12
    // mmm    | Month name - short        | Jan-Dec
    // mmmm   | Month name - full         | January-December
    // d      | Day                       | 1-31
    // dd     | Date with leading zero    | 01-31
    // ddd    | Weekday - short           | Sun-Sat
    // dddd   | Weekday - full            | Sunday-Saturday
    // H      | Hour                      | 0-23
    // HH     | Hour with leading zero    | 00-23
    // M      | Minute                    | 0-59
    // MM     | Minute with leading zero  | 00-59
    // @      | Calendar icon
    options = options || [
       'dddd', 'ddd', 'dd', 'd',
       'mmmm', 'mmm', 'mm', 'm',
       'yyyy', 'yy',
       'HH', 'H',
       'MM', 'M',
       '@'];
    $.each(options, function(i, itemFormat) {
      if (format.indexOf(itemFormat) !== -1) {
        var temp = format.split(itemFormat), new_result;
        if (options.length > 0 && temp[0] !== '') {
          new_result = result.concat(self._strftime(temp[0], action, options.slice(i)));
          if (new_result.length === result.length) {
            result.push(action(temp[0]));
          } else {
            result = new_result;
          }
        }
        result.push(action(itemFormat));
        if (options.length > 0 && temp[1] !== '') {
          new_result = result.concat(self._strftime(temp[1], action, options.slice(i)));
          if (new_result.length === result.length) {
            result.push(action(temp[1]));
          } else {
            result = new_result;
          }
        }
        return false;
      }
      if (options.length === 0) {
        return false;
      }
    });
    return result;
  },
  _getYears: function(format) {
    var years = [],
        current = this.getDate('yyyy'),
        _current = current,
        min,
        max;
    if (!current) {
      current = (new Date()).getFullYear();
      min = current - 10;
      max = current + 10;
    } else {
      min = this.pickadate.getdatelimit('yyyy'),
      max = this.pickadate.getDateLimit(true, 'yyyy');
    }
    years.push(this._createOption('', '--', _current === undefined));
    while (min <= max) {
      if (format === 'yy') {
        years.push(this._createOption(min, ('' + min).slice(-2), min === _current));
      } else {
        years.push(this._createOption(min, min, min === _current));
      }
      min += 1;
    }
    return years;
  },
  _getMonths: function(format) {
    var months = [],
        current = this.getDate('m'),
        month = 1;
    months.push(this._createOption('', '--', current === undefined));
    while (month <= 12) {
      if (format === 'm') {
        months.push(this._createOption(month, month, current === month));
      } else if (format === 'mm') {
        months.push(this._createOption(month,
            ('0' + month).slice(-2), current === month));
      } else if (format === 'mmm') {
        months.push(this._createOption(month,
            this.pickadateOptions.monthsShort[month - 1], current === month));
      } else {
        months.push(this._createOption(month,
            this.pickadateOptions.monthsFull[month - 1], current === month));
      }
      month += 1;
    }
    return months;
  },
  _getDays: function(format) {
    var days = [],
        current = this.getDate('d'),
        currentMonth = this.getDate('m'),
        maxDays = 31,
        day = 1;
    days.push(this._createOption('', '--', current === undefined));
    if (currentMonth) {
      if ($.inArray(currentMonth, [4, 6, 9, 11])) {
        maxDays = 30;
      } else if ($.inArray(currentMonth, [2])) {
        maxDays = 29;
      }
    }
    while (day <= maxDays) {
      if (format === 'd') {
        days.push(this._createOption(day, day, current === day));
      // formating of weekdays doesn't make sense in this case
      } else {
        days.push(this._createOption(day, ('0' + day).slice(-2), current === day));
      }
      day += 1;
    }
    return days;
  },
  _getAMPM: function() {
    return [
      this._createOption(this.options.AMPM[0], this.options.AMPM[0]),
      this._createOption(this.options.AMPM[1], this.options.AMPM[1])
      ];
  },
  _getHours: function(format) {
    var hours = [],
        current = this.getDate('h'),
        hour = 0;
    hours.push(this._createOption('', '--', current === undefined));
    while (hour < (this.options.showAMPM && 12 || 24)) {
      if (format === 'H') {
        hours.push(this._createOption(hour, hour, current === hour));
      } else {
        hours.push(this._createOption(hour, ('0' + hour).slice(-2), current === hour));
      }
      hour += 1;
    }
    return hours;
  },
  _getMinutes: function(format) {
    var minutes = [],
        current = this.getDate('m'),
        minute = 0;
    minutes.push(this._createOption('', '--', current === undefined));
    while (minute < 60) {
      if (format === 'M') {
        minutes.push(this._createOption(minute, minute, current === minute));
      } else {
        minutes.push(this._createOption(minute, ('0' + minute).slice(-2),
              current === minute));
      }
      minute += parseInt(this.options.minuteStep, 10);
    }
    return minutes;
  },
  _createOption: function(token, title, selected) {
    var $el = $('<option/>').attr('value', token).html(title);
    if (selected) {
      $el.attr('selected', 'selected');
    }
    return $el;
  },
  setDate: function(year, month, day, hour, minutes, ampm) {
     var self = this;
     self._rawDate = undefined;
     self.$el.attr('value', '');
     if (year !== '' &&
         month !== '' &&
         day !== '' &&
         hour !== '' &&
         minutes !== '') {
       self._rawDate = new Date(
         parseInt(year, 10),
         parseInt(month, 10),
         parseInt(day, 10),
         parseInt(hour, 10) + (ampm === 'PM' && 12 || 0),
         parseInt(minutes, 10)
         );
       self.$el.attr('value', self.getDate(self.options.formatSubmit));
     }
  },
  getDate: function(format) {
    var self = this;
    if (!self._rawDate) { return; }
    if (format) {
      return self._strftime(format, function(format) {
        switch (format) {
          case 'yy':
            return ('' + self._rawDate.getFullYear()).slice(-2);
          case 'yyyy':
            return '' + self._rawDate.getFullYear();
          case 'm':
            return '' + self._rawDate.getMonth();
          case 'mm':
            return ('0' + self._rawDate.getMonth()).slice(-2);
          case 'mmm':
            return self.pickadateOptions.monthsShort[self._rawDate.getMonth()];
          case 'mmmm':
            return self.pickadateOptions.monthsFull[self._rawDate.getMonth()];
          case 'd':
            return '' + self._rawDate.getDate();
          case 'dd':
            return ('0' + self._rawDate.getDate()).slice(-2);
          case 'ddd':
            return self.pickadateOptions.weekdaysShort[self._rawDate.getDay()];
          case 'dddd':
            return self.pickadateOptions.weekdaysFull[self._rawDate.getDay()];
          case 'H':
            return '' + self._rawDate.getHours();
          case 'HH':
            return ('0' + self._rawDate.getHours()).slice(-2);
          case 'M':
            return '' + self._rawDate.getMinutes();
          case 'MM':
            return ('0' + self._rawDate.getMinutes()).slice(-2);
          default:
            return format;
        }
      }).join('');
    }
    return self._rawDate;
  },
  toggle: function() {
    if (this._opened) {
      this.close();
    } else {
      this.open();
    }
  },
  open: function() {
    if (!this._opened) {
      this.pickadate.open();
      this._opened = true;
    }
  },
  close: function() {
    if (this._opened) {
      this.pickadate.close();
      this._opened = false;
    }
  }
});


Patterns.register(Calendar);

}(window.jQuery, window.Patterns));
