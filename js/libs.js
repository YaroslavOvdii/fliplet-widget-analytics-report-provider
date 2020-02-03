Fliplet.Registry.set('comflipletanalytics-report:1.0:core', function(element, data) {
  // Constants
  var DATA_STORE_KEY = 'analytics-data-array';
  var DATE_STORE_KEY = 'analytics-date-time';

  // Private variables
  var dateSelectMode;
  var analyticsStartDate;
  var analyticsEndDate;
  var analyticsPrevStartDate;
  var analyticsPrevEndDate;
  var customStartDateVariable;
  var customEndDateVariable;
  var timeDeltaInMillisecs;
  var pvDateTimeObject;
  var pvDataArray = {};
  var timelineActiveDevicesDataPrior = [];
  var timelineActiveDevicesData = [];
  var timelineSessionsDataPrior = [];
  var timelineSessionsData = [];
  var timelineScreenViewsDataPrior = [];
  var timelineScreenViewsData = [];
  var timelineInteractionsDataPrior = [];
  var timelineInteractionsData = [];
  var timelineChart = timelineChart || {};
  var chartEmptyData = [[], []];
  var cachedUserActionData = { data: [] };
  var cachedScreenActionData = { data: [] };

  var actionsPerUserTable;
  var actionsPerScreenTable;

  var compiledAppMetricsTemplate = Handlebars.compile(Fliplet.Widget.Templates['templates.interface.app-metrics']());
  var compiledActiveUserTemplate = Handlebars.compile(Fliplet.Widget.Templates['templates.interface.active-user']());
  var compiledPopularScreenTemplate = Handlebars.compile(Fliplet.Widget.Templates['templates.interface.popular-screen']());

  var configuration = data;
  var $container = $(element);
  var $body = $(document.body);
  var DATATABLE_HEADER_AND_FOOTER_HEIGHT = 120;
  var source = 'production';

  var configTableContext = {
    'users-sessions': {
      dataIndex: 0,
      tableRows: [
        {
          key: 'User',
          value: ['_userEmail', 'userEmail']
        },
        {
          key: 'Sessions',
          value: ['sessionsCount', 'uniqueSessions', 'count']
        }
      ],
      tableSelector: '.active-users-full-table-sessions',
      table: undefined,
      tableColumns: [
        { data: 'User' },
        { data: 'Sessions' }
      ],
      otherTableOne: 'users-screen-views',
      otherTableTwo: 'users-clicks',
      selectorsToHide: '.active-users-full-table-views, .active-users-full-table-clicks',
      selectorsToShow: '.active-users-full-table-sessions',
      order: [[1, 'desc']]
    },
    'users-screen-views': {
      dataIndex: 1,
      tableRows: [
        {
          key: 'User',
          value: ['_userEmail', 'userEmail']
        },
        {
          key: 'Screen views',
          value: ['count', 'totalPageViews']
        }
      ],
      tableSelector: '.active-users-full-table-views',
      table: undefined,
      tableColumns: [
        { data: 'User' },
        { data: 'Screen views' }
      ],
      otherTableOne: 'users-sessions',
      otherTableTwo: 'users-clicks',
      selectorsToHide: '.active-users-full-table-sessions, .active-users-full-table-clicks',
      selectorsToShow: '.active-users-full-table-views',
      order: [[1, 'desc']]
    },
    'users-clicks': {
      dataIndex: 2,
      tableRows: [
        {
          key: 'User',
          value: ['_userEmail', 'userEmail']
        },
        {
          key: 'Interactions',
          value: ['count', 'totalEvents']
        }
      ],
      tableSelector: '.active-users-full-table-clicks',
      table: undefined,
      tableColumns: [
        { data: 'User' },
        { data: 'Interactions' }
      ],
      otherTableOne: 'users-sessions',
      otherTableTwo: 'users-screen-views',
      selectorsToHide: '.active-users-full-table-sessions, .active-users-full-table-views',
      selectorsToShow: '.active-users-full-table-clicks',
      order: [[1, 'desc']]
    },
    'screens-screen-views': {
      dataIndex: 0,
      tableRows: [
        {
          key: 'Screen name',
          value: ['_pageTitle', 'pageTitle']
        },
        {
          key: 'Screen views',
          value: ['count', 'totalPageViews']
        }
      ],
      tableSelector: '.popular-sessions-full-table-views',
      table: undefined,
      tableColumns: [
        { data: 'Screen name' },
        { data: 'Screen views' }
      ],
      otherTableOne: 'screens-sessions',
      otherTableTwo: 'screens-clicks',
      selectorsToHide: '.popular-sessions-full-table-sessions, .popular-sessions-full-table-clicks',
      selectorsToShow: '.popular-sessions-full-table-views',
      order: [[1, 'desc']]
    },
    'screens-sessions': {
      dataIndex: 1,
      tableRows: [
        {
          key: 'Screen name',
          value: ['_pageTitle', 'pageTitle']
        },
        {
          key: 'Sessions',
          value: ['sessionsCount', 'uniqueSessions', 'count']
        }
      ],
      tableSelector: '.popular-sessions-full-table-sessions',
      table: undefined,
      tableColumns: [
        { data: 'Screen name' },
        { data: 'Sessions' }
      ],
      otherTableOne: 'screens-screen-views',
      otherTableTwo: 'screens-clicks',
      selectorsToHide: '.popular-sessions-full-table-views, .popular-sessions-full-table-clicks',
      selectorsToShow: '.popular-sessions-full-table-sessions',
      order: [[1, 'desc']]
    },
    'screens-clicks': {
      dataIndex: 2,
      tableRows: [
        {
          key: 'Screen name',
          value: ['_pageTitle', 'pageTitle']
        },
        {
          key: 'Interactions',
          value: ['count', 'totalEvents']
        }
      ],
      tableSelector: '.popular-sessions-full-table-clicks',
      table: undefined,
      tableColumns: [
        { data: 'Screen name' },
        { data: 'Interactions' }
      ],
      otherTableOne: 'screens-sessions',
      otherTableTwo: 'screens-screen-views',
      selectorsToHide: '.popular-sessions-full-table-views, .popular-sessions-full-table-sessions',
      selectorsToShow: '.popular-sessions-full-table-clicks',
      order: [[1, 'desc']]
    }
  };

  var chartContainer = $container.find('.chart-holder')[0];
  var chartConfig = {
    chart: {
      type: 'areaspline',
      style: {
        fontSize: '12px',
        fontWeight: 'normal',
        fontStyle: 'normal'
      },
      backgroundColor: '#f4f2f7',
      spacingLeft: 0,
      spacingRight: 0,
      spacingBottom: 0,
      spacingTop: 5
    },
    title: {
      text: '',
      style: {
        fontSize: '18px',
        fontWeight: 'normal',
        fontStyle: 'normal'
      }
    },
    subtitle: {
      text: '',
      style: {
        fontSize: '18px',
        fontWeight: 'normal',
        fontStyle: 'normal'
      }
    },
    exporting: {
      enabled: false
    },
    series: [{
      data: [],
      name: 'Prior period',
      marker: {
        symbol: 'circle'
      },
      type: 'areaspline',
      fillColor: 'rgba(182,189,204,0.2)',
      color: '#b6bdcc',
      label: {
        enabled: false
      }
    }, {
      data: [],
      name: 'Current period',
      marker: {
        symbol: 'circle'
      },
      type: 'areaspline',
      color: '#43ccf0',
      fillColor: 'rgba(67,204,240,0.4)',
      label: {
        enabled: false,
        connectorAllowed: false
      }
    }],
    plotOptions: {
      series: {
        dataLabels: {
          enabled: false
        }
      }
    },
    yAxis: [{
      title: {
        text: '',
        style: {
          fontSize: '18px',
          fontWeight: 'normal',
          fontStyle: 'normal'
        }
      },
      lineColor: '#f4f2f7'
    }],
    xAxis: [{
      title: {
        style: {
          fontSize: '18px',
          fontWeight: 'normal',
          fontStyle: 'normal'
        }
      },
      type: 'datetime',
      alignTicks: false,
      allowDecimals: false,
      minorTickLength: 0,
      tickLength: 5,
      lineColor: '#f4f2f7'
    }],
    tooltip: {
      borderWidth: 0,
      formatter: function() {
        var text = '';
        var momentTime;

        switch (dateSelectMode) {
          case 'last-24-hours':
            momentTime = moment(this.x).subtract(1, 'days');
            break;
          case 'last-7-days':
            momentTime = moment(this.x).subtract(7, 'days');
            break;
          case 'last-30-days':
            momentTime = moment(this.x).subtract(30, 'days');
            break;
          case 'last-90-days':
            momentTime = moment(this.x).subtract(90, 'days');
            break;
          case 'last-6-months':
            momentTime = moment(this.x).subtract(6, 'months');
            break;
          case 'last-12-months':
            momentTime = moment(this.x).subtract(12, 'months');
            break;
          case 'custom-dates':
            momentTime = moment(this.x).subtract(timeDeltaInMillisecs);
            break;
        }
        if(this.series.name == 'Prior period') {
          text = momentTime.format('MMM Do, HH:mm') + '<br><b>'
          + this.series.name + ':</b> ' + Highcharts.numberFormat(this.y, 0);
        } else {
          text = moment(this.x).format('MMM Do, HH:mm') + '<br><b>'
          + this.series.name + ':</b> ' + Highcharts.numberFormat(this.y, 0);
        }
        return text;
      }
    },
    pane: {
      background: []
    },
    legend: {
      itemStyle: {
        fontWeight: '500'
      },
    },
    credits: {
      enabled: false
    },
    lang: {
      thousandsSep: ' ,'
    }
  };

  function startLoading() {
    setLoadingProgress();
    $('.widget-holder').addClass('is-loading');
  }

  function stopLoading() {
    setTimeout(function () {
      $('.widget-holder').removeClass('is-loading');
    }, 500);
  }

  var progress = 0;

  function setLoadingProgress(progressUpdate) {
    if (!progressUpdate) {
      progress = 0;
    } else {
      progress += progressUpdate;

      if (progress > 100) {
        progress = 100;
      }
    }

    $('.progress-bar').attr('aria-valuenow', progress.toString());
    $('.progress-bar').css({
      width: progress.toString() + '%'
    });
  }

  function registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatNumber', function(num) {
      if (typeof num === 'string' && parseInt(num, 10) + '' === num) {
        num = parseInt(num, 10);
      }

      if (isNaN(num)) {
        return;
      }

      return num.toLocaleString();
    });
  }

  function attachEventListeners() {

    /*********************************************************
    Date picker overlay
    **********************************************************/
    $container.find('.datepicker').datepicker({
      format: 'd M yyyy',
      endDate: '0d',
      container: '.date-picker',
      orientation: 'left',
      autoclose: true
    });
    // custom dates start-date validation
    $container.find('.pickerStartDate').datepicker().on('hide changeDate', function(e) {
      // if start date exists check end date is after start date
      if (typeof $('.pickerEndDate').data('datepicker').dates[0] === 'undefined') {
        $('.custom-start-date-alert').removeClass('active');
        $container.find('.apply-button').prop('disabled', true);
      } else if ($('.pickerEndDate').data('datepicker').dates[0] < $('.pickerStartDate').data('datepicker').dates[0]) {
        $('.custom-dates-inputs').css({
          height: 'auto'
        });
        $('.custom-start-date-alert').addClass('active');
        $container.find('.apply-button').prop('disabled', true);
      } else {
        $('.custom-start-date-alert, .custom-end-date-alert').removeClass('active');
        $container.find('.apply-button').prop('disabled', false);
      }
    });
    // custom dates end-date validation
    $container.find('.pickerEndDate').datepicker().on('hide changeDate', function(e) {
      // if start date exists check end date is after start date
      if (typeof $container.find('.pickerStartDate').data('datepicker').dates[0] === 'undefined') {
        $container.find('.custom-end-date-alert').removeClass('active');
        $container.find('.apply-button').prop('disabled', true);
      } else if ($container.find('.pickerEndDate').data('datepicker').dates[0] < $container.find('.pickerStartDate').data('datepicker').dates[0]) {
        $container.find('.custom-dates-inputs').css({
          height: 'auto'
        });
        $container.find('.custom-end-date-alert').addClass('active');
        $container.find('.apply-button').prop('disabled', true);
      } else {
        $container.find('.custom-end-date-alert, .custom-start-date-alert').removeClass('active');
        $container.find('.apply-button').prop('disabled', false);
      }
    });

    $container
      .on('click', '.date-picker-option', function(event) {
        var value = $('.date-picker-option:checked').val();
        if (value == 'custom-dates') {
          $container.find('.apply-button').prop('disabled', true);
          var targetHeight = $(this).parents('.date-picker').find('.custom-dates-hidden-content').outerHeight();
          $(this).parents('.date-picker').find('.custom-dates-inputs').animate({
            height: targetHeight
          }, 150);
        } else {
          $container.find('.apply-button').prop('disabled', false);
          $(this).parents('.date-picker').find('.custom-dates-inputs').animate({
            height: 0
          }, 150);
        };
      })
      .on('click', '.agenda-icon, .timeframe-text', function() {
        $container.find('.date-picker').addClass('active');
        $body.addClass('freeze');
        Fliplet.Studio.emit('overlay-scroll-top', {
          name: 'app-analytics'
        });
      })
      .on('click', '.close-button', function() {
        $container.find('.full-screen-overlay').removeClass('active');
        $body.removeClass('freeze');
        Fliplet.Widget.autosize();
      })
      .on('click', '.apply-button', function() {
        var dateValue = $(this).parents('.date-picker').find('input[name="date-selector"]:checked').val();

        // Add spinner
        startLoading();

        switch (dateValue) {
          case 'last-24-hours':
            dateSelectMode = dateValue;
            calculateAnalyticsDatesFor24Hrs();
            updateTimeframe(analyticsStartDate, analyticsEndDate);
            getNewDataToRender('hour', 5);
            closeOverlay();
            break;
          case 'last-7-days':
            dateSelectMode = dateValue;
            calculateAnalyticsDates(7);
            updateTimeframe(analyticsStartDate, analyticsEndDate);
            getNewDataToRender('day', 5);
            closeOverlay();
            break;
          case 'last-30-days':
            dateSelectMode = dateValue;
            calculateAnalyticsDates(30);
            updateTimeframe(analyticsStartDate, analyticsEndDate);
            getNewDataToRender('day', 5);
            closeOverlay();
            break;
          case 'last-90-days':
            dateSelectMode = dateValue;
            calculateAnalyticsDates(90);
            updateTimeframe(analyticsStartDate, analyticsEndDate);
            getNewDataToRender('day', 5);
            closeOverlay();
            break;
          case 'last-6-months':
            dateSelectMode = dateValue;
            calculateAnalyticsDatesByMonth(6);
            updateTimeframe(analyticsStartDate, analyticsEndDate);
            getNewDataToRender('day', 5);
            closeOverlay();
            break;
          case 'last-12-months':
            dateSelectMode = dateValue;
            calculateAnalyticsDatesByMonth(12);
            updateTimeframe(analyticsStartDate, analyticsEndDate);
            getNewDataToRender('day', 5);
            closeOverlay();
            break;
          case 'custom-dates':
            customStartDateVariable = moment($(this).parents('.date-picker').find('.pickerStartDate').data('datepicker').dates[0]).utc().format('YYYY-MM-DD');
            customEndDateVariable = moment($(this).parents('.date-picker').find('.pickerEndDate').data('datepicker').dates[0]).utc().format('YYYY-MM-DD');
            if (typeof customStartDateVariable === 'undefined') {
              $(this).parents('.date-picker').find('.custom-dates-inputs').css({ height: 'auto' });
              $(this).parents('.date-picker').find('.custom-start-date-alert').addClass('active');
            } else if (typeof customEndDateVariable === 'undefined') {
              $(this).parents('.date-picker').find('.custom-dates-inputs').css({ height: 'auto' });
              $(this).parents('.date-picker').find('.custom-end-date-alert').addClass('active');
            } else if (customEndDateVariable < customStartDateVariable) {
              $(this).parents('.date-picker').find('.custom-dates-inputs').css({ height: 'auto' });
              $(this).parents('.date-picker').find('.custom-end-date-alert').addClass('active');
            } else {
              // no validation errors so update the dates
              dateSelectMode = dateValue;
              calculateAnalyticsDatesCustom(customStartDateVariable, customEndDateVariable, true);
              updateTimeframe(analyticsStartDate, analyticsEndDate);
              getNewDataToRender('day', 5);
              closeOverlay();
            }
            break;
        }
      })
      .on('click', '.more-active-users', function() {
        $container.find('.active-users-overlay').addClass('active');
        $body.addClass('freeze');
        Fliplet.Studio.emit('overlay-scroll-top', {
          name: 'app-analytics'
        });
        getMoreActiveUsers();
      })
      .on('click', '.actions-by-user', function() {
        $container.find('.actions-per-user-overlay').addClass('active');
        $body.addClass('freeze');
        Fliplet.Studio.emit('overlay-scroll-top', {
          name: 'app-analytics'
        });
        renderUserActionsDatatable();
      })
      .on('click', '.more-popular-sessions', function() {
        $container.find('.popular-sessions-overlay').addClass('active');
        $body.addClass('freeze');
        Fliplet.Studio.emit('overlay-scroll-top', {
          name: 'app-analytics'
        });
        getMorePopularScreens();
      })
      .on('click', '.actions-by-screen', function() {
        $container.find('.actions-per-screen-overlay').addClass('active');
        $body.addClass('freeze');
        Fliplet.Studio.emit('overlay-scroll-top', {
          name: 'app-analytics'
        });
        renderScreenActionsDatatable();
      })
      .on('change', '[name="timeline-selector"]', function() {
        var value = $('[name="timeline-selector"]:checked').val();

        switch (value) {
          case 'timeline-active-users':
            // datetime specified in milliseconds
            getChart().series[0].setData(timelineActiveDevicesDataPrior);
            getChart().series[1].setData(timelineActiveDevicesData);
            break;
          case 'timeline-sessions':
            // datetime specified in milliseconds
            getChart().series[0].setData(timelineSessionsDataPrior);
            getChart().series[1].setData(timelineSessionsData);
            break;
          case 'timeline-screen-views':
            // datetime specified in milliseconds
            getChart().series[0].setData(timelineScreenViewsDataPrior);
            getChart().series[1].setData(timelineScreenViewsData);
            break;
          case 'timeline-clicks':
            // datetime specified in milliseconds
            getChart().series[0].setData(timelineInteractionsDataPrior);
            getChart().series[1].setData(timelineInteractionsData);
            break;
        }
      })
      .on('change', '[name="users-selector"]', function() {
        var value = $('[name="users-selector"]:checked').val();

        switch (value) {
          case 'users-sessions':
            $(this).parents('.analytics-box').find('.analytics-row-wrapper-users').html(compiledActiveUserTemplate(pvDataArray.activeUserData[0]));
            break;
          case 'users-screen-views':
            $(this).parents('.analytics-box').find('.analytics-row-wrapper-users').html(compiledActiveUserTemplate(pvDataArray.activeUserData[1]));
            break;
          case 'users-clicks':
            $(this).parents('.analytics-box').find('.analytics-row-wrapper-users').html(compiledActiveUserTemplate(pvDataArray.activeUserData[2]));
            break;
        }
      })
      .on('change', '[name="screen-selector"]', function() {
        var value = $('[name="screen-selector"]:checked').val();

        switch (value) {
          case 'screens-screen-views':
            $(this).parents('.analytics-box').find('.analytics-row-wrapper-screen').html(compiledPopularScreenTemplate(pvDataArray.popularScreenData[0]));
            break;
          case 'screens-sessions':
            $(this).parents('.analytics-box').find('.analytics-row-wrapper-screen').html(compiledPopularScreenTemplate(pvDataArray.popularScreenData[1]));
            break;
          case 'screens-clicks':
            $(this).parents('.analytics-box').find('.analytics-row-wrapper-screen').html(compiledPopularScreenTemplate(pvDataArray.popularScreenData[2]));
            break;
        }
      });
  }

  function getChartConfig() {
    return chartConfig;
  }

  function getChart() {
    return timelineChart[configuration.id];
  }

  function chartInitialization(element, options) {
    timelineChart[configuration.id] = Highcharts.chart(element, options);
    getChart().series[0].setData(chartEmptyData);
    getChart().series[1].setData(chartEmptyData);
  }

  function closeOverlay() {
    // close overlay
    $container.find('.full-screen-overlay').removeClass('active');
    $body.removeClass('freeze');
  }

  function storeDataToPersistantVariable() {
    // save dates to a persistant variable
    pvDateTimeObject = {
      dateSelectMode: dateSelectMode || 'last-7-days',
      lastAccessedAt: moment().valueOf(),
      sd: analyticsStartDate,
      ed: analyticsEndDate,
      psd: analyticsPrevStartDate,
      ped: analyticsPrevEndDate,
    };

    return Fliplet.App.Storage.set(DATE_STORE_KEY, pvDateTimeObject).then(function () {
      return Fliplet.App.Storage.set(DATA_STORE_KEY, pvDataArray);
    });
  }

  function getDataFromPersistantVariable() {

    // get dates and times
    Fliplet.App.Storage.get(DATE_STORE_KEY)
      .then(function(analyticsDateTime) {
        if (analyticsDateTime && moment().diff(moment(analyticsDateTime.lastAccessedAt), 'days') < 1) {
          pvDateTimeObject = analyticsDateTime;
          dateSelectMode = pvDateTimeObject.dateSelectMode;
          if (pvDateTimeObject.sd.match(/^\d{4}-\d{2}-\d{2}$/)) {
            analyticsStartDate = pvDateTimeObject.sd;
            analyticsEndDate = pvDateTimeObject.ed;
            analyticsPrevStartDate = pvDateTimeObject.psd;
            analyticsPrevEndDate = pvDateTimeObject.ped;
          } else {
            analyticsStartDate = moment(pvDateTimeObject.sd).format('YYYY-MM-DD');
            analyticsEndDate = moment(pvDateTimeObject.ed).format('YYYY-MM-DD');
            analyticsPrevStartDate = moment(pvDateTimeObject.psd).format('YYYY-MM-DD');
            analyticsPrevEndDate = moment(pvDateTimeObject.ped).format('YYYY-MM-DD');
          }

          updateTimeframe(analyticsStartDate, analyticsEndDate);
          $('[name="date-selector"][value="'+ dateSelectMode +'"]').prop('checked', true);
        } else {
          // default to last 7 days if nothing previously selected
          dateSelectMode = 'last-7-days';
          calculateAnalyticsDates(7);
          updateTimeframe(analyticsStartDate, analyticsEndDate);
        };
      });

    Fliplet.App.Storage.get(DATA_STORE_KEY)
      .then(function(analyticsDataArray) {
        var context;

        if (analyticsDataArray) {
          prepareDataToRender(analyticsDataArray.data, analyticsDataArray.periodInMs, analyticsDataArray.context);
          stopLoading();
          Fliplet.Widget.autosize();

          context = analyticsDataArray.context;
        }

        // Read live data in background
        Promise.all([
          getMetricsData(analyticsStartDate, analyticsEndDate, analyticsPrevStartDate, context || 'day'),
          getTimelineData(analyticsStartDate, analyticsEndDate, analyticsPrevStartDate, context || 'day'),
          getActiveUserData(analyticsStartDate, analyticsEndDate, 5),
          getPopularScreenData(analyticsStartDate, analyticsEndDate, 5)
        ]).then(function(data) {
          var periodDurationInMs = moment.duration(moment(analyticsEndDate).diff(moment(analyticsStartDate))).add(context !== 'hour' ? 1 : 0, context || 'day').asMilliseconds();
          prepareDataToRender(data, periodDurationInMs, context || 'day');

          stopLoading();
          Fliplet.Widget.autosize();
        }).catch(function(error) {
          console.error(error)
        });
      });
  }

  function calculateAnalyticsDatesFor24Hrs() {
    var d = moment();
    analyticsEndDate = d.format('YYYY-MM-DD');
    analyticsStartDate = d.subtract(1, 'day').format('YYYY-MM-DD');
    analyticsPrevEndDate = d.subtract(1, 'day').format('YYYY-MM-DD');
    analyticsPrevStartDate = d.subtract(1, 'day').format('YYYY-MM-DD');
  }

  function calculateAnalyticsDates(daysToGoBack) {
    analyticsStartDate = moment().utc().format('YYYY-MM-DD');
    analyticsEndDate = moment().utc().format('YYYY-MM-DD');
    calculateAnalyticsDatesCustom(analyticsStartDate, analyticsEndDate, false, 'days', daysToGoBack);
  }

  function calculateAnalyticsDatesByMonth(monthsToGoBack) {
    analyticsStartDate = moment().utc().format('YYYY-MM-DD');
    analyticsEndDate = moment().utc().format('YYYY-MM-DD');
    calculateAnalyticsDatesCustom(analyticsStartDate, analyticsEndDate, false, 'months', monthsToGoBack);
  }

  function calculateAnalyticsDatesCustom(customStartDate, customEndDate, isCustom, time, timeToGoBack) {
    if (isCustom) {
      timeToGoBack = moment(customEndDate).diff(moment(customStartDate), 'days') + 1;
      timeDeltaInMillisecs = moment(customEndDate).diff(moment(customStartDate), 'ms');
      time = 'days';

      // Set start date
      analyticsStartDate = customStartDate;
      // Set end date
      analyticsEndDate = customEndDate;
    } else {
      // Set start date
      analyticsStartDate = moment(customStartDate).subtract(timeToGoBack, time).add(1, 'day').format('YYYY-MM-DD');
      // Set end date
      analyticsEndDate = customEndDate;
    }

    // Set previous period start date
    analyticsPrevStartDate = moment(analyticsStartDate).subtract(timeToGoBack, time).format('YYYY-MM-DD');
    // Set previous period end date
    analyticsPrevEndDate = moment(analyticsEndDate).subtract(timeToGoBack, time).format('YYYY-MM-DD');
  }

  function updateTimeframe(startDate, endDate) {
    // Make the dates readable
    $container.find('.analytics-date-range').html(moment(startDate).format('D MMM \'YY') + " - " + moment(endDate).format('D MMM \'YY'));
  }

  function getNewDataToRender(context, limit) {

    Promise.all([
      getMetricsData(analyticsStartDate, analyticsEndDate, analyticsPrevStartDate, context),
      getTimelineData(analyticsStartDate, analyticsEndDate, analyticsPrevStartDate, context),
      getActiveUserData(analyticsStartDate, analyticsEndDate, limit),
      getPopularScreenData(analyticsStartDate, analyticsEndDate, limit)
    ]).then(function(data) {
      var periodDurationInMs = moment.duration(moment(analyticsEndDate).diff(moment(analyticsStartDate))).add(context !== 'hour' ? 1 : 0, context).asMilliseconds();
      prepareDataToRender(data, periodDurationInMs, context)

      stopLoading();
      Fliplet.Widget.autosize();
    }).catch(function(error) {
      console.error(error)
    });
  }

  function prepareDataToRender(data, periodInMs, context) {
    pvDataArray = {
      metricsData: data[0],
      timelineData: data[1],
      activeUserData: data[2],
      popularScreenData: data[3],
      context: context,
      periodInMs: periodInMs,
      data: data
    }

    storeDataToPersistantVariable();
    renderData(periodInMs, context)
  }

  function normalizeAggregatedData(data, type) {
    var prior = data[0];
    var current = data[1];
    var aggregatedData = [];
    if (prior) {
      aggregatedData.push({
        count: prior.data.map(function (x) { return +x[type] }).reduce(function (a, b) { return a + b }, 0),
        periodStart: prior.periodStart,
        periodEnd: prior.periodEnd,
      })
    }
    if (current) {
      aggregatedData.push({
        count: current.data.map(function (x) { return +x[type] }).reduce(function (a, b) { return a + b }, 0),
        periodStart: current.periodStart,
        periodEnd: current.periodEnd,
      })
    }
    return aggregatedData;
  }

  function renderData(periodInMs, context) {
    // RENDER APP METRICS
    var appMetricsArrayData = [];
    pvDataArray.metricsData.forEach(function(arr, index) {
      var newObj = {};
      switch (index) {
        case 0:
          newObj['Title'] = 'Active devices';
          newObj['Prior period'] = arr.metricActiveDevicesPrior;
          newObj['Selected period'] = arr.metricActiveDevices;
          break;
        case 1:
          newObj['Title'] = 'New devices';
          newObj['Prior period'] = arr.metricNewDevicesPrior;
          newObj['Selected period'] = arr.metricNewDevices;
          break;
        case 2:
          newObj['Title'] = 'Sessions';
          newObj['Prior period'] = arr[0] ? arr[0].count : 0;
          newObj['Selected period'] = arr[1] ? arr[1].count : 0;
          break;
        case 3:
          newObj['Title'] = 'Screen views';
          newObj['Prior period'] = arr[0] ? arr[0].count : 0;
          newObj['Selected period'] = arr[1] ? arr[1].count : 0;
          break;
        case 4:
          newObj['Title'] = 'Interactions';
          newObj['Prior period'] = arr[0] ? arr[0].count : 0;
          newObj['Selected period'] = arr[1] ? arr[1].count : 0;
          break;
      }
      appMetricsArrayData.push(newObj);
    });
    $container.find('.analytics-row-wrapper-metrics').html(compiledAppMetricsTemplate(appMetricsArrayData));

    // RENDER MOST ACTIVE USERS
    switch ($container.find('[name="users-selector"]:checked').val()) {
      case 'users-sessions':
        $container.find('.analytics-row-wrapper-users').html(compiledActiveUserTemplate(pvDataArray.activeUserData[0]));
        break;
      case 'users-screen-views':
        $container.find('.analytics-row-wrapper-users').html(compiledActiveUserTemplate(pvDataArray.activeUserData[1]));
        break;
      case 'users-clicks':
        $container.find('.analytics-row-wrapper-users').html(compiledActiveUserTemplate(pvDataArray.activeUserData[2]));
        break;
    }

    // RENDER MOST POPULAR SCREENS
    switch ($container.find('[name="screen-selector"]:checked').val()) {
      case 'screens-screen-views':
        $container.find('.analytics-row-wrapper-screen').html(compiledPopularScreenTemplate(pvDataArray.popularScreenData[0]));
        break;
      case 'screens-sessions':
        $container.find('.analytics-row-wrapper-screen').html(compiledPopularScreenTemplate(pvDataArray.popularScreenData[1]));
        break;
      case 'screens-clicks':
        $container.find('.analytics-row-wrapper-screen').html(compiledPopularScreenTemplate(pvDataArray.popularScreenData[2]));
        break;
    }

    // MUTATE TIMELINE DATA
    // Active devices
    timelineActiveDevicesDataPrior = []; // Cleans it
    timelineActiveDevicesData = []; // Cleans it
    pvDataArray.timelineData[0].forEach(function(period, index) {
      switch (index) {
        case 0:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push((moment(obj[context]).valueOf()) + pvDataArray.periodInMs);
            newArray.push(parseInt(obj.uniqueDevices || obj.uniqueDeviceTracking, 10));
            timelineActiveDevicesDataPrior.push(newArray);
          });
          break;
        case 1:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push(moment(obj[context]).valueOf());
            newArray.push(parseInt(obj.uniqueDevices || obj.uniqueDeviceTracking, 10));
            timelineActiveDevicesData.push(newArray);
          });
          break;
      }
    });
    timelineActiveDevicesDataPrior = _.orderBy(timelineActiveDevicesDataPrior, function(item) {
      return item[0];
    }, ['asc']);
    timelineActiveDevicesData = _.orderBy(timelineActiveDevicesData, function(item) {
      return item[0];
    }, ['asc']);

    // Sessions
    timelineSessionsDataPrior = []; // Cleans it
    timelineSessionsData = []; // Cleans it
    pvDataArray.timelineData[1].forEach(function(period, index) {
      switch (index) {
        case 0:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push((moment(obj[context]).valueOf()) + pvDataArray.periodInMs);
            newArray.push(parseInt(obj.uniqueSessions || obj.sessionsCount, 10));
            timelineSessionsDataPrior.push(newArray);
          });
          break;
        case 1:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push(moment(obj[context]).valueOf());
            newArray.push(parseInt(obj.uniqueSessions || obj.sessionsCount, 10));
            timelineSessionsData.push(newArray);
          });
          break;
      }
    });
    timelineSessionsDataPrior = _.orderBy(timelineSessionsDataPrior, function(item) {
      return item[0];
    }, ['asc']);
    timelineSessionsData = _.orderBy(timelineSessionsData, function(item) {
      return item[0];
    }, ['asc']);

    // Screen views
    timelineScreenViewsDataPrior = []; // Cleans it
    timelineScreenViewsData = []; // Cleans it
    pvDataArray.timelineData[2].forEach(function(period, index) {
      switch (index) {
        case 0:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push((moment(obj[context]).valueOf()) + pvDataArray.periodInMs);
            newArray.push(parseInt(obj.totalPageViews || obj.count, 10));
            timelineScreenViewsDataPrior.push(newArray);
          });
          break;
        case 1:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push(moment(obj[context]).valueOf());
            newArray.push(parseInt(obj.totalPageViews || obj.count, 10));
            timelineScreenViewsData.push(newArray);
          });
          break;
      }
    });
    timelineScreenViewsDataPrior = _.orderBy(timelineScreenViewsDataPrior, function(item) {
      return item[0];
    }, ['asc']);
    timelineScreenViewsData = _.orderBy(timelineScreenViewsData, function(item) {
      return item[0];
    }, ['asc']);

    // Interaction
    timelineInteractionsDataPrior = []; // Cleans it
    timelineInteractionsData = []; // Cleans it
    pvDataArray.timelineData[3].forEach(function(period, index) {
      switch (index) {
        case 0:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push((moment(obj[context]).valueOf()) + pvDataArray.periodInMs);
            newArray.push(parseInt(obj.totalEvents || obj.count, 10));
            timelineInteractionsDataPrior.push(newArray);
          });
          break;
        case 1:
          period.data.forEach(function(obj) {
            var newArray = [];
            newArray.push(moment(obj[context]).valueOf());
            newArray.push(parseInt(obj.totalEvents || obj.count, 10));
            timelineInteractionsData.push(newArray);
          });
          break;
      }
    });
    timelineInteractionsDataPrior = _.orderBy(timelineInteractionsDataPrior, function(item) {
      return item[0];
    }, ['asc']);
    timelineInteractionsData = _.orderBy(timelineInteractionsData, function(item) {
      return item[0];
    }, ['asc']);

    // RENDER TIMELINE
    switch ($container.find('[name="timeline-selector"]:checked').val()) {
      case 'timeline-active-users':
        getChart().series[0].setData(timelineActiveDevicesDataPrior);
        getChart().series[1].setData(timelineActiveDevicesData);
        break;
      case 'timeline-sessions':
        getChart().series[0].setData(timelineSessionsDataPrior);
        getChart().series[1].setData(timelineSessionsData);
        break;
      case 'timeline-screen-views':
        getChart().series[0].setData(timelineScreenViewsDataPrior);
        getChart().series[1].setData(timelineScreenViewsData);
        break;
      case 'timeline-clicks':
        getChart().series[0].setData(timelineInteractionsDataPrior);
        getChart().series[1].setData(timelineInteractionsData);
        break;
    }

    Fliplet.Widget.autosize();
  }

  function getMetricsData(currentPeriodStartDate, currentPeriodEndDate, priorPeriodStartDate, groupBy) {
    var periodDuration = moment.duration(moment(currentPeriodEndDate).diff(moment(currentPeriodStartDate))).add(groupBy !== 'hour' ? 1 : 0, groupBy);
    var previousPeriodNewUsers;
    var currentPeriodNewUsers;
    var previousPeriodUsers;
    var currentPeriodUsers;

    // get active devices
    var metricDevices = Fliplet.App.Analytics.Aggregate.count({
      source: source,
      column: 'uniqueDevices',
      from: priorPeriodStartDate,
      to: moment(currentPeriodStartDate).subtract(1, 'ms').format('YYYY-MM-DD')
    }).then(function(previousPeriod) {
      previousPeriodUsers = previousPeriod;
      // 2. get devices up to end of previous period
      return Fliplet.App.Analytics.Aggregate.count({
        source: source,
        column: 'uniqueDevices',
        from: currentPeriodStartDate,
        to: currentPeriodEndDate
      }).then(function(currentPeriod) {
        currentPeriodUsers = currentPeriod
        return;
      });
    }).then(function() {
      return {
        metricActiveDevicesPrior: previousPeriodUsers,
        metricActiveDevices: currentPeriodUsers
      }
    });

    // Get new devices
    var metricNewDevices = Fliplet.App.Analytics.Aggregate.count({
      source: source,
      column: 'uniqueDevices',
      to: priorPeriodStartDate
    }).then(function(countUpToStartOfPriorPeriod) {
      // 2. get devices up to end of previous period
      return Fliplet.App.Analytics.Aggregate.count({
        source: source,
        column: 'uniqueDevices',
        to: currentPeriodStartDate
      }).then(function(countUpToStartOfCurrentPeriod) {
        previousPeriodNewUsers = countUpToStartOfCurrentPeriod - countUpToStartOfPriorPeriod;

        // 3. get all time total count
        return Fliplet.App.Analytics.Aggregate.count({
          source: source,
          column: 'uniqueDevices',
          to: currentPeriodEndDate
        }).then(function(countUpToEndOfCurrentPeriod) {
          currentPeriodNewUsers = countUpToEndOfCurrentPeriod - countUpToStartOfCurrentPeriod;
        });
      })
    }).then(function() {
      return {
        metricNewDevicesPrior: previousPeriodNewUsers,
        metricNewDevices: currentPeriodNewUsers
      }
    });

    var metricSessions;
    var metricScreenViews;
    var metricInteractions;

    if (groupBy === 'hour') {
      metricSessions = Fliplet.App.Analytics.get({
        source: source,
        group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
        attributes: [{ distinctCount: true, col: 'data._analyticsSessionId', as: 'sessionsCount' }],
        where: {
          data: { _analyticsSessionId: { $ne: null } },
          createdAt: {
            $gte: moment(priorPeriodStartDate).valueOf(),
            $lte: moment(currentPeriodEndDate).valueOf()
          }
        },
        period: {
          duration: periodDuration.asMilliseconds(),
          col: groupBy,
          count: 'sessionsCount'
        }
      }).then(function(results){
        return results.logs;
      });

      // Get count of screen views
      metricScreenViews = Fliplet.App.Analytics.get({
        source: source,
        group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
        where: {
          type: 'app.analytics.pageView',
          createdAt: {
            $gte: moment(priorPeriodStartDate).valueOf(),
            $lte: moment(currentPeriodEndDate).valueOf()
          }
        },
        period: {
          duration: periodDuration.asMilliseconds(),
          col: groupBy,
          count: true
        }
      }).then(function(results){
        return results.logs;
      });

      // Get count of interactions
      metricInteractions = Fliplet.App.Analytics.get({
        source: source,
        group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
        where: {
          type: 'app.analytics.event',
          data: {
            nonInteraction: null
          },
          createdAt: {
            $gte: moment(priorPeriodStartDate).valueOf(),
            $lte: moment(currentPeriodEndDate).valueOf()
          }
        },
        period: {
          duration: periodDuration.asMilliseconds(),
          col: groupBy,
          count: true
        }
      }).then(function(results){
        return results.logs;
      });
    } else {
      metricSessions = Fliplet.App.Analytics.Aggregate.get({
        source: source,
        period: Math.floor(periodDuration.asDays()),
        from: priorPeriodStartDate,
        to: currentPeriodEndDate,
        sum: 'uniqueSessions'
      }).then(function (results) {
        return normalizeAggregatedData(results, 'uniqueSessions')
      });

      metricScreenViews = Fliplet.App.Analytics.Aggregate.get({
        source: source,
        period: Math.floor(periodDuration.asDays()),
        from: priorPeriodStartDate,
        to: currentPeriodEndDate,
        sum: 'totalPageViews'
      }).then(function (results) {
        return normalizeAggregatedData(results, 'totalPageViews')
      });


      metricInteractions = Fliplet.App.Analytics.Aggregate.get({
        source: source,
        period: Math.floor(periodDuration.asDays()),
        from: priorPeriodStartDate,
        to: currentPeriodEndDate,
        sum: 'totalEvents'
      }).then(function (results) {
        return normalizeAggregatedData(results, 'totalEvents')
      });
    }

    return Promise.all([metricDevices, metricNewDevices, metricSessions, metricScreenViews, metricInteractions]).then(function (results) {
      setLoadingProgress(25);
      return results;
    });
  }

  function getTimelineData(currentPeriodStartDate, currentPeriodEndDate, priorPeriodStartDate, groupBy) {
    var periodDuration = moment.duration(moment(currentPeriodEndDate).diff(moment(currentPeriodStartDate))).add(groupBy !== 'hour' ? 1 : 0, groupBy);
    var useLiveData = groupBy === 'hour' || moment().diff(moment(priorPeriodStartDate), 'hours') <= 48;

    if (!useLiveData) {
      return Fliplet.App.Analytics.Aggregate.get({
        source: source,
        period: Math.floor(periodDuration.asDays()),
        from: priorPeriodStartDate,
        to: currentPeriodEndDate
      }).then(function (logs) {
        // Simulate 4 requests like the other live analytics APIs above
        return [logs, logs, logs, logs];
      });
    }

    // timeline of active devices
    var timelineDevices = Fliplet.App.Analytics.get({
      source: source,
      group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
      attributes: [{ distinctCount: true, col: 'data._deviceTrackingId', as: 'uniqueDeviceTracking' }],
      where: {
        data: { _deviceTrackingId: { $ne: null } },
        createdAt: {
          $gte: moment(priorPeriodStartDate).valueOf(),
          $lte: moment(currentPeriodEndDate).valueOf()
        }
      },
      period: {
        duration: periodDuration.asMilliseconds(),
        col: groupBy
      }
    }).then(function(results){
      return results.logs;
    });

    // timeline of sessions
    var timelineSessions = Fliplet.App.Analytics.get({
      source: source,
      group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
      attributes: [{ distinctCount: true, col: 'data._analyticsSessionId', as: 'sessionsCount' }],
      where: {
        data: { _analyticsSessionId: { $ne: null } },
        createdAt: {
          $gte: moment(priorPeriodStartDate).valueOf(),
          $lte: moment(currentPeriodEndDate).valueOf()
        }
      },
      period: {
        duration: periodDuration.asMilliseconds(),
        col: groupBy
      }
    }).then(function(results){
      return results.logs;
    });

    // timeline of screen views
    var timelineScreenViews = Fliplet.App.Analytics.get({
      source: source,
      group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
      where: {
        type: 'app.analytics.pageView',
        createdAt: {
          $gte: moment(priorPeriodStartDate).valueOf(),
          $lte: moment(currentPeriodEndDate).valueOf()
        }
      },
      period: {
        duration: periodDuration.asMilliseconds(),
        col: groupBy
      }
    }).then(function(results){
      return results.logs;
    });

    // timeline of interactions
    var timelineInteractions = Fliplet.App.Analytics.get({
      source: source,
      group: [{ fn: 'date_trunc', part: groupBy, col: 'createdAt', as: groupBy }],
      where: {
        type: 'app.analytics.event',
        data: {
          nonInteraction: null
        },
        createdAt: {
          $gte: moment(priorPeriodStartDate).valueOf(),
          $lte: moment(currentPeriodEndDate).valueOf()
        }
      },
      period: {
        duration: periodDuration.asMilliseconds(),
        col: groupBy
      }
    }).then(function(results){
      return results.logs;
    });

    return Promise.all([timelineDevices, timelineSessions, timelineScreenViews, timelineInteractions]).then(function (results) {
      setLoadingProgress(25);
      return results;
    });
  }

  function getActiveUserData(currentPeriodStartDate, currentPeriodEndDate, limit) {
    var userTableSessions = Fliplet.App.Analytics.Aggregate.get({
      source: source,
      group: 'user',
      sum: 'uniqueSessions',
      order: [['count', 'DESC']],
      limit: limit,
      from: currentPeriodStartDate,
      to: currentPeriodEndDate
    });

    var userTableScreenViews = Fliplet.App.Analytics.Aggregate.get({
      source: source,
      group: 'user',
      sum: 'totalPageViews',
      order: [['count', 'DESC']],
      limit: limit,
      from: currentPeriodStartDate,
      to: currentPeriodEndDate
    });

    var userTableInteractions = Fliplet.App.Analytics.Aggregate.get({
      source: source,
      group: 'user',
      sum: 'totalEvents',
      order: [['count', 'DESC']],
      limit: limit,
      from: currentPeriodStartDate,
      to: currentPeriodEndDate
    });

    return Promise.all([userTableSessions, userTableScreenViews, userTableInteractions]).then(function (results) {
      setLoadingProgress(25);
      return results;
    });
  }

  function getPopularScreenData(currentPeriodStartDate, currentPeriodEndDate, limit) {
    var screenTableScreenViews = Fliplet.App.Analytics.Aggregate.get({
      source: source,
      group: 'page',
      sum: 'totalPageViews',
      order: [['count', 'DESC']],
      limit: limit,
      from: currentPeriodStartDate,
      to: currentPeriodEndDate
    });

    var screenTableSessions = Fliplet.App.Analytics.Aggregate.get({
      source: source,
      group: 'page',
      sum: 'uniqueSessions',
      order: [['count', 'DESC']],
      limit: limit,
      from: currentPeriodStartDate,
      to: currentPeriodEndDate
    });

    var screenTableScreenInteractions = Fliplet.App.Analytics.Aggregate.get({
      source: source,
      group: 'page',
      sum: 'totalEvents',
      order: [['count', 'DESC']],
      limit: limit,
      from: currentPeriodStartDate,
      to: currentPeriodEndDate
    });

    return Promise.all([screenTableScreenViews, screenTableSessions, screenTableScreenInteractions]).then(function (results) {
      setLoadingProgress(25);
      return results;
    });
  }

  function loadUserActionsData(limit, offset, searchClause, orderArray) {
    var where = {
      createdAt: {
        $gte: moment(analyticsStartDate).valueOf(),
        $lte: moment(analyticsEndDate).valueOf()
      },
      $or: [
        {
          type: 'app.analytics.event'
        },
        {
          type: 'app.analytics.pageView'
        }
      ]
    };
    where = Object.assign(where, searchClause);

    return Fliplet.App.Analytics.get({
      source: source,
      limit: limit,
      offset: offset,
      where: where,
      order: orderArray,
      group: [
        'data._userEmail', 'data._pageTitle', 'data.category', 'data.action', 'data.label', 'type'
      ]
    })
      .then(function (pageEvents) {
        var data = pageEvents.logs.map(function (event) {
          return {
            'User': event._userEmail || null,
            'Screen': event._pageTitle || null,
            'Type': event.type.replace('app.analytics.', ''),
            'Event category': event.category || null,
            'Event action': event.action || null,
            'Event label': event.label || null,
            'Count': parseInt(event.count, 10) || 0
          }
        });

        cachedUserActionData = { data: data, count: pageEvents.count.length };
        return cachedUserActionData;
      });
  }

  function renderUserActionsDatatable() {
    if (actionsPerUserTable) {
      actionsPerUserTable.clear();
      actionsPerUserTable.rows.add(cachedUserActionData.data);
      actionsPerUserTable.draw();
    } else {
      actionsPerUserTable = $('.actions-per-user').DataTable({
        ajax: function (data, callback, settings) {

          var searchedColumns = data.columns.map(function (c, i) {
            return { column: settings.aoColumns[i].key, value: c.search.value }
          }).filter(function (c) {
            return c.value
          });

          var searchClause = {
            $and: searchedColumns.map(function (sc) {
              var clause = {};
              if (sc.column === 'type') {
                clause[sc.column] = { $iLike: '%app.analytics.' + sc.value + '%' };
              }
              else {
                clause[sc.column] = { $iLike: '%' + sc.value + '%' };
              }
              return clause;
            })
          };

          if (data.search && data.search.value) {
            var searchValue = '%' + data.search.value + '%';

            searchClause['$or'] = [
              { 'data._userEmail': { $iLike: searchValue } },
              { 'data._pageTitle': { $iLike: searchValue } },
              { 'type': { $iLike: '%app.analytics.' + data.search.value + '%' } },
              { 'data.category': { $iLike: searchValue } },
              { 'data.action': { $iLike: searchValue } },
              { 'data.label': { $iLike: searchValue } }
            ]
          };

          var orderArray = data.order.map(function (orderObject) {
            return [
              settings.aoColumns[orderObject.column].key,
              orderObject.dir.toUpperCase()
            ]
          });

          loadUserActionsData(data.length, data.start, searchClause, orderArray).then(function (paginatedData) {
            callback({
              data: paginatedData.data,
              recordsTotal: paginatedData.count,
              recordsFiltered: paginatedData.count
            });
          })
        },
        columns: [
          { data: 'User', key: 'data._userEmail' },
          { data: 'Screen', key: 'data._pageTitle' },
          { data: 'Type', key: 'type' },
          { data: 'Event category', key: 'data.category' },
          { data: 'Event action', key: 'data.action' },
          { data: 'Event label', key: 'data.label' },
          { data: 'Count', key: 'data.count' }
        ],
        dom: 'Blfrtip',
        buttons: [
          {
            extend: 'excel',
            text: 'export visible entries to Excel'
          }
        ],
        lengthMenu: [10, 25, 50, 100, 500],
        scrollY: 400,
        scrollCollapse: true,
        pageLength: 10,
        processing: true,
        serverSide: true,
        responsive: {
          details: {
            display: $.fn.dataTable.Responsive.display.childRow
          }
        }
      });
      renderColumnFilters(actionsPerUserTable);
    }
    setTimeout(function() {
      Fliplet.Studio.emit('widget-autosize', {
        height: $('.full-screen-overlay.active').find('.dataTables_wrapper').outerHeight() + DATATABLE_HEADER_AND_FOOTER_HEIGHT
      });
    }, 1000);
  }

  function loadScreenActionsData(limit, offset, searchClause, orderArray) {
    var where = {
      createdAt: {
        $gte: moment(analyticsStartDate).valueOf(),
        $lte: moment(analyticsEndDate).valueOf()
      },
      type: 'app.analytics.event'
    };

    where = Object.assign(where, searchClause);

    return Fliplet.App.Analytics.get({
      source: source,
      limit: limit,
      offset: offset,
      where: where,
      order: orderArray,
      group: [
        'data._pageTitle', 'data.category', 'data.action', 'data.label', 'type'
      ]
    })
      .then(function (pageEvents) {
        var data = pageEvents.logs.map(function (event) {
          return {
            'Screen name': event._pageTitle || null,
            'Event category': event.category || null,
            'Event action': event.action || null,
            'Event label': event.label || null,
            'Count': parseInt(event.count, 10) || 0
          }
        });
        cachedScreenActionData = { data: data, count: pageEvents.count.length };
        return cachedScreenActionData;
      });
  }

  function renderScreenActionsDatatable() {
    if (actionsPerScreenTable) {
      actionsPerScreenTable.clear();
      actionsPerScreenTable.rows.add(cachedScreenActionData.data);
      actionsPerScreenTable.draw();
    } else {
      actionsPerScreenTable = $('.actions-per-screen').DataTable({
        ajax: function (data, callback, settings) {
          var searchedColumns = data.columns.map(function (c, i) {
            return { column: settings.aoColumns[i].key, value: c.search.value }
          }).filter(function (c) {
            return c.value
          });

          var searchClause = {
            $and: searchedColumns.map(function (sc) {
              var clause = {};
              clause[sc.column] = { $iLike: '%' + sc.value + '%' };
              return clause;
            })
          };

          if(data.search && data.search.value){
            var searchValue = '%' + data.search.value + '%';

            searchClause['$or'] =[
              { 'data.category': { $iLike: searchValue } },
              { 'data.action': { $iLike: searchValue } },
              { 'data.label': { $iLike: searchValue } },
              { 'data._pageTitle': { $iLike: searchValue } }
            ]
          };

          var orderArray = data.order.map(function (orderObject) {
            return [
              settings.aoColumns[orderObject.column].key,
              orderObject.dir.toUpperCase()
            ]
          });

          loadScreenActionsData(data.length, data.start, searchClause, orderArray).then(function (paginatedData) {
            callback({
              data: paginatedData.data,
              recordsTotal: paginatedData.count,
              recordsFiltered: paginatedData.count
            });
          })
        },
        columns: [
          { data: 'Screen name', key: 'data._pageTitle' },
          { data: 'Event category', key: 'data.category' },
          { data: 'Event action', key: 'data.action' },
          { data: 'Event label', key: 'data.label' },
          { data: 'Count', key: 'data.count' },
        ],
        dom: 'Blfrtip',
        buttons: [
          {
             extend: 'excel',
             text: 'export visible entries to Excel'
          }
        ],
        lengthMenu: [10, 25, 50, 100, 500],
        scrollY: 400,
        scrollCollapse: true,
        pageLength: 10,
        processing: true,
        serverSide: true,
        responsive: {
          details: {
            display: $.fn.dataTable.Responsive.display.childRow
          }
        }
      });
      renderColumnFilters(actionsPerScreenTable);
    }
    setTimeout(function() {
      Fliplet.Studio.emit('widget-autosize', {
        height: $('.full-screen-overlay.active').find('.dataTables_wrapper').outerHeight() + DATATABLE_HEADER_AND_FOOTER_HEIGHT
      });
    }, 1000);
  }

  function renderColumnFilters(table){
    table.columns().every(function () {
      var column = this;
      var input = $('<input type="text" class="filter" />');
      input.appendTo($(column.header()))
      input.on('click', function (event) {
        event.stopPropagation();
      })
      input.on('input', function () {
        column
          .search(this.value)
          .draw();
      });
    });
  }

  function renderTable(data, context) {
    tableDataArray = [];
    data[configTableContext[context].dataIndex].forEach(function(row) {
      var newObj = {};

      [0, 1].forEach(function (idx) {
        var fieldKey = configTableContext[context].tableRows[idx].key;
        var values = configTableContext[context].tableRows[idx].value;

        if (!Array.isArray(values)) {
          values = [values];
        }

        configTableContext[context].tableRows[idx].value.forEach(function (val) {
          newObj[fieldKey] = newObj[fieldKey] || row[val] || null;
        });
      });

      tableDataArray.push(newObj);
    });
    if (configTableContext[context].table) {
      configTableContext[context].table.clear();
      configTableContext[context].table.rows.add(tableDataArray);
      configTableContext[context].table.draw();
    } else {
      configTableContext[context].table = $(configTableContext[context].tableSelector).DataTable({
        data: tableDataArray,
        columns: configTableContext[context].tableColumns,
        dom: 'Blfrtip',
        buttons: [
          {
             extend: 'excel',
             text: 'export visible entries to Excel'
          }
        ],
        lengthMenu: [10, 25, 50, 100, 500],
        order: configTableContext[context].order,
        responsive: {
          details: {
            display: $.fn.dataTable.Responsive.display.childRow
          }
        }
      });
    }
    if (configTableContext[configTableContext[context].otherTableOne].table) {
      configTableContext[configTableContext[context].otherTableOne].table.destroy();
      configTableContext[configTableContext[context].otherTableOne].table = null;
    }
    if (configTableContext[configTableContext[context].otherTableTwo].table) {
      configTableContext[configTableContext[context].otherTableTwo].table.destroy();
      configTableContext[configTableContext[context].otherTableTwo].table = null;
    }
    $container.find(configTableContext[context].selectorsToShow).removeClass('hidden');
    $container.find(configTableContext[context].selectorsToHide).addClass('hidden');
  }

  function getMoreActiveUsers() {
    var buttonSelected = $('[name="users-selector"]:checked').val();

    getActiveUserData(analyticsStartDate, analyticsEndDate)
      .then(function(data) {
        switch (buttonSelected) {
          case 'users-sessions':
            renderTable(data, buttonSelected);
            break;
          case 'users-screen-views':
            tableDataArray = [];
            renderTable(data, buttonSelected);
            break;
          case 'users-clicks':
            renderTable(data, buttonSelected);
            break;
        }
      });
  }

  function getMorePopularScreens() {
    var buttonSelected = $('[name="screen-selector"]:checked').val();

    getPopularScreenData(analyticsStartDate, analyticsEndDate)
      .then(function(data) {
        switch (buttonSelected) {
          case 'screens-screen-views':
            renderTable(data, buttonSelected);
            break;
          case 'screens-sessions':
            renderTable(data, buttonSelected);
            break;
          case 'screens-clicks':
            renderTable(data, buttonSelected);
            break;
        }
      });
  }

  function start() {
    var dateSelectModeDefault = dateSelectMode || 'last-7-days';
    var selectors = [
      '[name="date-selector"][value="'+ dateSelectModeDefault +'"]',
      '[name="timeline-selector"][value="timeline-active-users"]',
      '[name="users-selector"][value="users-sessions"]',
      '[name="screen-selector"][value="screens-sessions"]'
    ].join(', ');

    registerHandlebarsHelpers();
    attachEventListeners();

    // Selects radio buttons by default
    $container.find(selectors).prop('checked', true);

    // Load timeline chart
    chartInitialization(chartContainer, getChartConfig());

    // Run once on load
    getDataFromPersistantVariable();
  }

  start();

  return {
    getChartConfig: getChartConfig,
    getChart: getChart
  }
});
