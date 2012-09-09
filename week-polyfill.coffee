###
HTML5 Week polyfill | Jonathan Stipe | https://github.com/jonstipe/week-polyfill
###
(($) ->
  $.fn.inputWeek = ->
    readWeek = (w_str) ->
      if /^\d{4,}-W\d\d$/.test w_str
        matchData = /^(\d+)-W(\d+)$/.exec w_str
        yearPart = parseInt matchData[1], 10
        weekPart = parseInt matchData[2], 10
        { year: yearPart, week: weekPart }
      else
        throw "Invalid week string: #{w_str}"

    makeWeekString = (week_obj) ->
      w_arr = [week_obj['year'].toString()]
      w_arr.push '-W'
      w_arr.push '0' if week_obj['week'] < 10
      w_arr.push week_obj['week'].toString()
      w_arr.join ''

    makeWeekDisplayString = (week_obj, elem) ->
      $elem = $ elem
      month_names = $elem.datepicker "option", "monthNames"
      start_date = getFirstDayOfWeek week_obj
      end_date = getLastDayOfWeek week_obj
      week_arr = [week_obj['year'].toString()] 
      week_arr.push ' Week '
      week_arr.push week_obj['week']
      week_arr.push ': '
      week_arr.push month_names[start_date.getMonth()]
      week_arr.push ' '
      week_arr.push start_date.getDate().toString()
      week_arr.push ' - '
      if start_date.getMonth() != end_date.getMonth()
        week_arr.push month_names[end_date.getMonth()]
        week_arr.push ' '
      week_arr.push end_date.getDate().toString()
      week_arr.join ''

    getThursdayOfSameWeek = (dateObj) ->
      thursOfWeek = new Date(dateObj.getTime())
      if dateObj.getDay() == 0
        thursOfWeek.setDate(dateObj.getDate() - 3)
      else if dateObj.getDay() > 4
        thursOfWeek.setDate(dateObj.getDate() - (dateObj.getDay() - 3))
      else if dateObj.getDay() < 4
        thursOfWeek.setDate(dateObj.getDate() + (4 - dateObj.getDay()))
      thursOfWeek

    getWeekOfDate = (dateObj) ->
      thursOfWeek = getThursdayOfSameWeek dateObj
      { year: thursOfWeek.getFullYear(), week: $.datepicker.iso8601Week(thursOfWeek) }

    getFirstDayOfWeek = (week_obj) ->
      if week_obj['week'] > 0 && week_obj['week'] <= 53
        kDate = getThursdayOfSameWeek(new Date(week_obj['year'], 0, 1))
        kDate.setDate(kDate.getDate() + (week_obj['week'] * 7) - 2)
        kDate
      else
        throw "Week number is out of range."

    getLastDayOfWeek = (week_obj) ->
      if week_obj['week'] > 0 && week_obj['week'] <= 53
        kDate = getThursdayOfSameWeek(new Date(week_obj['year'], 0, 1))
        kDate.setDate(kDate.getDate() + (week_obj['week'] * 7) + 4)
        kDate
      else
        throw "Week number is out of range."

    getThursdayOfWeek = (week_obj) ->
      if week_obj['week'] > 0 && week_obj['week'] <= 53
        kDate = getThursdayOfSameWeek(new Date(week_obj['year'], 0, 1))
        kDate.setDate(kDate.getDate() + (week_obj['week'] * 7))
        kDate
      else
        throw "Week number is out of range."

    # -1 : week1 is later
    #  0 : same
    #  1 : week2 is later
    compareWeeks = (week1, week2) ->
      if week1['year'] > week2['year']
        -1
      else if week1['year'] == week2['year']
        if week1['week'] > week2['week']
          -1
        else if week1['week'] == week2['week']
          0
        else
          1
      else
        1

    distanceBetweenWeeks = (week1, week2) ->
      week1day = getThursdayOfWeek week1
      week2day = getThursdayOfWeek week2
      Math.round((week2day.getTime() - week1day.getTime()) / 604800000)

    dateIsInStep = (date, min, step) ->
      weekObj = getWeekOfDate date
      startWeek = if (min?) then min else { year: 1970, week: 1 }
      weekDist = distanceBetweenWeeks startWeek, weekObj
      (weekDist % step) == 0

    advanceWeek = (inWeek, amt) ->
      thursday = getThursdayOfWeek inWeek
      thursday.setDate(thursday.getDate() + (amt * 7))
      { year: thursday.getFullYear(), week: $.datepicker.iso8601Week(thursday) }

    regressWeek = (inWeek, amt) ->
      thursday = getThursdayOfWeek inWeek
      thursday.setDate(thursday.getDate() - (amt * 7))
      { year: thursday.getFullYear(), week: $.datepicker.iso8601Week(thursday) }

    increment = (hiddenField, weekBtn, calendarDiv) ->
      $hiddenField = $ hiddenField
      value = readWeek $hiddenField.val()
      step = $hiddenField.data "step"
      max = $hiddenField.data "max"
      if !step? || step == 'any'
        value = advanceWeek value, 1
      else
        value = advanceWeek value, step
      if max? && compareWeeks(value, max) == -1
        value['year'] = max['year']
        value['week'] = max['week']
      value = stepNormalize value, hiddenField
      $hiddenField.val(makeWeekString(value)).change()
      $(weekBtn).text makeWeekDisplayString(value, calendarDiv)
      $(calendarDiv).datepicker "setDate", getFirstDayOfWeek(value)
      null

    decrement = (hiddenField, weekBtn, calendarDiv) ->
      $hiddenField = $ hiddenField
      value = readWeek $hiddenField.val()
      step = $hiddenField.data "step"
      min = $hiddenField.data "min"
      if !step? || step == 'any'
        value = regressWeek value, 1
      else
        value = regressWeek value, step
      if min? && compareWeeks(value, min) == 1
        value['year'] = min['year']
        value['week'] = min['week']
      value = stepNormalize value, hiddenField
      $hiddenField.val(makeWeekString(value)).change()
      $(weekBtn).text makeWeekDisplayString(value, calendarDiv)
      $(calendarDiv).datepicker "setDate", getFirstDayOfWeek(value)
      null

    stepNormalize = (inWeek, hiddenField) ->
      $hiddenField = $ hiddenField
      step = $hiddenField.data "step"
      min = $hiddenField.data "min"
      if step? && step != 'any'
        stepDiff = distanceBetweenWeeks(( if min? then min else { year: 1970, week: 1 }), inWeek) % step
        if stepDiff == 0
          inWeek
        else
          stepDiff2 = step - stepDiff
          if stepDiff > stepDiff2
            advanceWeek { year: inWeek['year'], week: inWeek['week'] }, stepDiff2
          else
            regressWeek { year: inWeek['year'], week: inWeek['week'] }, stepDiff
      else
        inWeek

    $(this).filter('input[type="week"]').each ->
      $this = $ this
      value = $this.attr 'value'
      min = $this.attr 'min'
      max = $this.attr 'max'
      step = $this.attr 'step'
      className = $this.attr 'class'
      style = $this.attr 'style'
      if value? && /^\d{4,}-W\d\d$/.test value
        value = readWeek value
      else
        value = new Date()
        value = { year: value.getFullYear(), week: $.datepicker.iso8601Week value }
      if min?
        min = readWeek min
        if compareWeeks(value, min) == 1
          value['year'] = min['year']
          value['week'] = min['week']
      if max?
        max = readWeek max
        if compareWeeks(value, max) == -1
          value['year'] = max['year']
          value['week'] = max['week']
      if step? && step != 'any'
        step = parseInt step, 10
      else
        step = 1
      hiddenField = document.createElement 'input'
      $hiddenField = $ hiddenField
      $hiddenField.attr
        type: "hidden"
        name: $this.attr 'name'
        value: makeWeekString value
      $hiddenField.data
        min: min
        max: max
        step: step

      value = stepNormalize value, hiddenField
      $hiddenField.attr 'value', makeWeekString(value)

      calendarContainer = document.createElement 'span'
      $calendarContainer = $ calendarContainer
      $calendarContainer.attr 'class', className if className?
      $calendarContainer.attr 'style', style if style?
      calendarDiv = document.createElement 'div'
      $calendarDiv = $ calendarDiv
      $calendarDiv.css
        display: 'none'
        position: 'absolute'
      weekBtn = document.createElement 'button'
      $weekBtn = $ weekBtn
      $weekBtn.addClass 'week-datepicker-button'

      $this.replaceWith hiddenField
      $calendarContainer.insertAfter hiddenField
      $weekBtn.appendTo calendarContainer
      $calendarDiv.appendTo calendarContainer

      $calendarDiv.datepicker
        dateFormat: 'MM dd, yy'
        showButtonPanel: true
        showWeek: true
        firstDay: 1
        beforeShowDay: (date) ->
          min = $hiddenField.data 'min'
          step = $hiddenField.data 'step'
          if step? && step != 'any'
            [dateIsInStep(date, min, step), ""]
          else
            [true, ""]
      $weekBtn.text makeWeekDisplayString(value, calendarDiv)

      $calendarDiv.datepicker "option", "minDate", getFirstDayOfWeek(min) if min?
      $calendarDiv.datepicker "option", "maxDate", getLastDayOfWeek(max) if max?
      if Modernizr.csstransitions
        calendarDiv.className = "week-calendar-dialog week-closed"
        $weekBtn.click (event) ->
          $calendarDiv.off 'transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd'
          calendarDiv.style.display = 'block'
          calendarDiv.className = "week-calendar-dialog week-open"
          event.preventDefault()
          false
        closeFunc = (event) ->
          if calendarDiv.className == "week-calendar-dialog week-open"
            transitionend_function = (event, ui) ->
              calendarDiv.style.display = 'none'
              $calendarDiv.off "transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function
              null
            $calendarDiv.on "transitionend oTransitionEnd webkitTransitionEnd MSTransitionEnd", transitionend_function
            calendarDiv.className = "week-calendar-dialog week-closed"
          event.preventDefault() if event?
          null
      else
        $weekBtn.click (event) ->
          $calendarDiv.fadeIn 'fast'
          event.preventDefault()
          false
        closeFunc = (event) ->
          $calendarDiv.fadeOut 'fast'
          event.preventDefault() if event?
          null
      $calendarDiv.mouseleave closeFunc
      $calendarDiv.datepicker "option", "onSelect", (dateText, inst) ->
        dateObj = $.datepicker.parseDate 'MM dd, yy', dateText
        weekObj = getWeekOfDate dateObj
        $hiddenField.val(makeWeekString(weekObj)).change()
        $weekBtn.text makeWeekDisplayString(weekObj, calendarDiv)
        closeFunc()
        null
      $calendarDiv.datepicker "setDate", getFirstDayOfWeek(value)
      $weekBtn.on
        DOMMouseScroll: (event) ->
          if event.originalEvent.detail < 0
            increment hiddenField, weekBtn, calendarDiv
          else
            decrement hiddenField, weekBtn, calendarDiv
          event.preventDefault()
          null
        mousewheel: (event) ->
          if event.originalEvent.wheelDelta > 0
            increment hiddenField, weekBtn, calendarDiv
          else
            decrement hiddenField, weekBtn, calendarDiv
          event.preventDefault()
          null
        keypress: (event) ->
          if event.keyCode == 38 # up arrow
            increment hiddenField, weekBtn, calendarDiv
            event.preventDefault()
          else if event.keyCode == 40 # down arrow
            decrement hiddenField, weekBtn, calendarDiv
            event.preventDefault()
          null
      null
    this
  $ ->
    $('input[type="week"]').inputWeek() unless Modernizr.inputtypes.week
    null
  null
)(jQuery)