(function($){
  $(function(){
    if (!Modernizr.inputtypes.week) {
      var readWeek = function(w_str) {
        if (/^\d{4,}-W\d\d$/.test(w_str)) {
          var matchData = /^(\d+)-W(\d+)$/.exec(w_str),
            yearPart = parseInt(matchData[1], 10),
            weekPart = parseInt(matchData[2], 10);
          return { year: yearPart, week: weekPart };
        } else throw "Invalid week string: " + w_str;
      };
      var makeWeekString = function(week_obj) {
        var w_arr = [week_obj['year'].toString()];
        w_arr.push('-W');
        if (week_obj['week'] < 10) w_arr.push('0');
        w_arr.push(week_obj['week'].toString());
        return w_arr.join('');
      };
      var makeWeekDisplayString = function(week_obj, elem) {
        var $elem = $(elem),
          month_names = $elem.datepicker( "option", "monthNames" ),
          start_date = getFirstDayOfWeek(week_obj),
          end_date = getLastDayOfWeek(week_obj),
          week_arr = [week_obj['year'].toString()]; 
        week_arr.push(' Week ');
        week_arr.push(week_obj['week'])
        week_arr.push(': ');
        week_arr.push(month_names[start_date.getMonth()]);
        week_arr.push(' ');
        week_arr.push(start_date.getDate().toString());
        week_arr.push(' - ');
        if (start_date.getMonth() != end_date.getMonth()) {
          week_arr.push(month_names[end_date.getMonth()]);
          week_arr.push(' ');
        }
        week_arr.push(end_date.getDate().toString());
        return week_arr.join('');
      };
      var getThursdayOfThatWeek = function(dateObj) {
        var thursOfWeek = new Date(dateObj.getTime());
        if (dateObj.getDay() == 0) thursOfWeek.setDate(dateObj.getDate() - 3);
        else if (dateObj.getDay() > 4) thursOfWeek.setDate(dateObj.getDate() - (dateObj.getDay() - 3));
        else if (dateObj.getDay() < 4) thursOfWeek.setDate(dateObj.getDate() + (4 - dateObj.getDay()));
        return thursOfWeek;
      };
      var getWeekOfDate = function(dateObj) {
        var thursOfWeek = getThursdayOfThatWeek(dateObj);
        return { year: thursOfWeek.getFullYear(), week: $.datepicker.iso8601Week(thursOfWeek) };
      };
      var getFirstDayOfWeek = function(week_obj) {
        if (week_obj['week'] > 0 && week_obj['week'] <= 53) {
          var kDate = getThursdayOfThatWeek(new Date(week_obj['year'], 0, 1));
          kDate.setDate(kDate.getDate() + ((week_obj['week'] - 1) * 7));
          if (kDate.getDay() > 1) kDate.setDate(kDate.getDate() - (kDate.getDay() - 1));
          else if (kDate.getDay() == 0) kDate.setDate(kDate.getDate() - 6);
          return kDate;
        } else throw "Week number is out of range.";
      };
      var getLastDayOfWeek = function(week_obj) {
        if (week_obj['week'] > 0 && week_obj['week'] <= 53) {
          var kDate = getThursdayOfThatWeek(new Date(week_obj['year'], 0, 1));
          kDate.setDate(kDate.getDate() + ((week_obj['week'] - 1) * 7));
          if (kDate.getDay() > 0) kDate.setDate(kDate.getDate() + (7 - kDate.getDay()));
          return kDate;
        } else throw "Week number is out of range.";
      };
      // -1 : week1 is later
      // 0 : same
      // 1: week2 is later
      var compareWeeks = function(week1, week2) {
        if (week1['year'] > week2['year']) return -1;
        else if (week1['year'] == week2['year']) {
          if (week1['week'] > week2['week']) return -1;
          else if (week1['week'] == week2['week']) return 0;
          else return 1;
        } else return 1;
      };
      var distanceBetweenWeeks = function(week1, week2) {
        var week1day = getFirstDayOfWeek(week1),
          week2day = getFirstDayOfWeek(week2);
        week1day.setDate(week1day.getDate() + 3);
        week2day.setDate(week2day.getDate() + 3);
        return Math.round((week2day.getTime() - week1day.getTime()) / 604800000);
      };
      var dateIsInStep = function(date, min, step) {
        var weekObj = getWeekOfDate(date);
        var startWeek = (min !== undefined) ? min : { year: 1970, week: 1 };
        var weekDist = distanceBetweenWeeks(startWeek, weekObj);
        return ((weekDist % step) == 0);
      };
      var advanceWeek = function(inWeek, amt) {
        var firstDay = getFirstDayOfWeek(inWeek);
        firstDay.setDate(firstDay.getDate() + (amt * 7) + 3);
        var outWeek = { year: firstDay.getFullYear(), week: $.datepicker.iso8601Week(firstDay) };
        return outWeek;
      };
      var regressWeek = function(inWeek, amt) {
        var firstDay = getFirstDayOfWeek(inWeek);
        firstDay.setDate(firstDay.getDate() - (amt * 7) + 3);
        var outWeek = { year: firstDay.getFullYear(), week: $.datepicker.iso8601Week(firstDay) };
        return outWeek;
      };
      var increment = function(hiddenField, weekBtn, calendarDiv) {
        var $hiddenField = $(hiddenField);
        var value = readWeek($hiddenField.val());
        var step = $hiddenField.data("step");
        var max = $hiddenField.data("max");
        if (step === undefined || step == 'any') value = advanceWeek(value, 1);
        else value = advanceWeek(value, step);
        if (max !== undefined && compareWeeks(value, max) == -1) {
          value['year'] = max['year'];
          value['week'] = max['week'];
        }
        value = stepNormalize(value, hiddenField);
        $hiddenField.val(makeWeekString(value)).change();
        $(weekBtn).text(makeWeekDisplayString(value, calendarDiv));
        $(calendarDiv).datepicker("setDate", getFirstDayOfWeek(value));
      };
      var decrement = function(hiddenField, weekBtn, calendarDiv) {
        var $hiddenField = $(hiddenField);
        var value = readWeek($hiddenField.val());
        var step = $hiddenField.data("step");
        var min = $hiddenField.data("min");
        if (step === undefined || step == 'any') value = regressWeek(value, 1);
        else value = regressWeek(value, step);
        if (min !== undefined && compareWeeks(value, min) == 1) {
          value['year'] = min['year'];
          value['week'] = min['week'];
        }
        value = stepNormalize(value, hiddenField);
        $hiddenField.val(makeWeekString(value)).change();
        $(weekBtn).text(makeWeekDisplayString(value, calendarDiv));
        $(calendarDiv).datepicker("setDate", getFirstDayOfWeek(value));
      };
      var stepNormalize = function(inWeek, hiddenField) {
        var $hiddenField = $(hiddenField);
        var step = $hiddenField.data("step");
        var min = $hiddenField.data("min");
        if (step !== undefined && step != 'any') {
          var stepDiff = distanceBetweenWeeks(((min !== undefined) ? min : { year: 1970, week: 1 }), inWeek) % step;
          if (stepDiff == 0) return inWeek;
          else {
            var stepDiff2 = step - stepDiff;
            if (stepDiff > stepDiff2) {
              var outWeek = { year: inWeek['year'], week: inWeek['week'] };
              outWeek = advanceWeek(outWeek, stepDiff2);
              return outWeek;
            } else {
              var outWeek = { year: inWeek['year'], week: inWeek['week'] };
              outWeek = regressWeek(outWeek, stepDiff);
              return outWeek;
            }
          }
        } else return inWeek;
      }
      
      $('input[type="week"]').each(function(index) {
        var $this = $(this), value, min, max, step;
        if ($this.attr('value') !== undefined && /^\d{4,}-W\d\d$/.test($this.attr('value'))) value = readWeek($this.attr('value'));
        else {
          value = new Date();
          value = { year: value.getFullYear(), week: $.datepicker.iso8601Week(value) };
        }
        if ($this.attr('min') !== undefined) {
          min = readWeek($this.attr('min'));
          if (compareWeeks(value, min) == 1) {
            value['year'] = min['year'];
            value['week'] = min['week'];
          }
        }
        if ($this.attr('max') !== undefined) {
          max = readWeek($this.attr('max'));
          if (compareWeeks(value, max) == -1) {
            value['year'] = max['year'];
            value['week'] = max['week'];
          }
        }
        if ($this.attr('step') == 'any') step = 1;
        else if ($this.attr('step') !== undefined) step = parseInt($this.attr('step'), 10);
        else step = 1;
        var hiddenField = document.createElement('input');
        var $hiddenField = $(hiddenField);
        $hiddenField.attr({
          type: "hidden",
          name: $(this).attr('name'),
          value: makeWeekString(value)
        });
        $hiddenField.data('min', min);
        $hiddenField.data('max', max);
        $hiddenField.data('step', step);

        value = stepNormalize(value, hiddenField);
        $hiddenField.attr('value', makeWeekString(value));

        var calendarContainer = document.createElement('span');
        var $calendarContainer = $(calendarContainer);
        if ($this.attr('class') !== undefined) $calendarContainer.attr('class', $this.attr('class'));
        if ($this.attr('style') !== undefined) $calendarContainer.attr('style', $this.attr('style'));
        var calendarDiv = document.createElement('div');
        var $calendarDiv = $(calendarDiv);
        $calendarDiv.css({
          display: 'none',
          position: 'absolute'
        });
        var weekBtn = document.createElement('button');
        var $weekBtn = $(weekBtn);
        $weekBtn.addClass('week-datepicker-button');

        $this.replaceWith(hiddenField);
        $calendarContainer.insertAfter(hiddenField);
        $weekBtn.appendTo(calendarContainer);
        $calendarDiv.appendTo(calendarContainer);

        $calendarDiv.datepicker({
          dateFormat: 'MM dd, yy',
          showButtonPanel: true,
          showWeek: true,
          firstDay: 1,
          beforeShowDay: function(date) {
            var min = $hiddenField.data('min'),
              step = $hiddenField.data('step');
            if (step !== undefined && step != 'any') {
              return [dateIsInStep(date, min, step), ""];
            } else return [true, ""];
          }
        });

        $weekBtn.text(makeWeekDisplayString(value, calendarDiv));

        if (min !== undefined) $calendarDiv.datepicker("option", "minDate", getFirstDayOfWeek(min));
        if (max !== undefined) $calendarDiv.datepicker("option", "maxDate", getLastDayOfWeek(max));
        var closeFunc;
        if (Modernizr.csstransitions) {
          calendarDiv.className = "week-calendar-dialog week-closed";
          $weekBtn.click(function () {
            $calendarDiv.unbind('transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd');
            calendarDiv.style.display = 'block';
            calendarDiv.className = "week-calendar-dialog week-open";
            return false;
          });
          closeFunc = function () {
            if (calendarDiv.className == "week-calendar-dialog week-open") {
              var transitionend_function = function(event, ui) {
                calendarDiv.style.display = 'none';
                $calendarDiv.unbind("transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function);
              }
              $calendarDiv.bind("transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function);
              calendarDiv.className = "week-calendar-dialog week-closed";
              return false;
            }
          }
        } else {
          $weekBtn.click(function(event) {
            event.preventDefault();
            $calendarDiv.fadeIn('fast');
          });
          closeFunc = function() {
            $calendarDiv.fadeOut('fast');
          };
        }

        $calendarDiv.mouseleave(closeFunc);
        $calendarDiv.datepicker( "option", "onSelect", function(dateText, inst) {
          var dateObj = $.datepicker.parseDate('MM dd, yy', dateText);
          var weekObj = getWeekOfDate(dateObj);
          $hiddenField.val(makeWeekString(weekObj)).change();
          $weekBtn.text(makeWeekDisplayString(weekObj, calendarDiv));
          closeFunc();
        });
        $calendarDiv.datepicker("setDate", getFirstDayOfWeek(value));
        $weekBtn.bind({
          DOMMouseScroll: function(event) {
            if (event.detail < 0) increment(hiddenField, weekBtn, calendarDiv);
            else decrement(hiddenField, weekBtn, calendarDiv);
            event.preventDefault();
          },
          mousewheel: function(event) {
            if (event.wheelDelta > 0) increment(hiddenField, weekBtn, calendarDiv);
            else decrement(hiddenField, weekBtn, calendarDiv);
            event.preventDefault();
          },
          keypress: function(event) {
            if (event.keyCode == 38) { // up arrow
              increment(hiddenField, weekBtn, calendarDiv);
              event.preventDefault();
            } else if (event.keyCode == 40) { // down arrow
              decrement(hiddenField, weekBtn, calendarDiv);
              event.preventDefault();
            }
          }
        });
      });
    }
  });
})(jQuery);