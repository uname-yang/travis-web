import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads, and, not, equal } from '@ember/object/computed';
import { task } from 'ember-concurrency';
import { format as d3format } from 'd3';

const intervalOverrides = {
  day: {
    subInterval: '1hour',
  },
  week: {
    subInterval: '1day',
    tooltipLabelFormat: '%A, %b %e',
  },
};

export default Component.extend({
  classNames: ['insights-odyssey'],
  classNameBindings: ['isLoading:insights-odyssey--loading'],
  private: false,

  insights: service(),

  // Chart Options
  intervalSettings: computed(function () {
    return this.get('insights').getIntervalSettings(intervalOverrides);
  }),

  currentIntervalLabel: computed('interval', 'intervalSettings', function () {
    return this.intervalSettings[this.interval].instanceLabel;
  }),

  // Current Interval Chart Data
  requestData: task(function* () {
    return yield this.get('insights.getChartData').perform(
      this.owner,
      this.interval,
      'builds',
      'sum',
      ['count_passed', 'count_failed', 'count_errored', 'count_canceled'],
      {
        intervalSettings: intervalOverrides,
        private: this.private,
      }
    );
  }),
  chartData: reads('requestData.lastSuccessful.value'),
  isLoading: reads('requestData.isRunning'),
  isNotLoading: not('isLoading'),

  passed: reads('chartData.data.count_passed.plotValues'),
  failed: reads('chartData.data.count_failed.plotValues'),
  errored: reads('chartData.data.count_errored.plotValues'),
  cancelled: reads('chartData.data.count_canceled.plotValues'),

  labels: reads('chartData.labels'),
  total: reads('chartData.data.total'),

  isEmpty: equal('total', 0),
  hasNoBuilds: and('isNotLoading', 'isEmpty'),

  // Chart component data
  data: computed('passed', 'failed', 'errored', 'cancelled', 'labels',
    function () {
      return {
        type: 'bar',
        x: 'x',
        groups: [['Passing', 'Failing', 'Errored', 'Cancelled']],
        order: 'asc',
        columns: [
          ['x', ...this.get('labels')],
          ['Passing', ...this.get('passed')],
          ['Failing', ...this.get('failed')],
          ['Errored', ...this.get('errored')],
          ['Cancelled', ...this.get('cancelled')],
        ],
        colors: {
          Passing: 'rgba(57, 170, 86, 0.8)',
          Failing: 'rgba(219, 69, 69, 0.8)',
          Errored: 'rgba(237, 222, 63, 0.8)',
          Cancelled: 'rgba(157, 157, 157, 0.8)',
        },
      };
    }
  ),

  // Chart component options
  grid: {
    lines: { front: false },
    y: {
      show: true,
    }
  },

  axis: {
    x: {
      type: 'timeseries',
      tick: { format: '%b %e' },
    },
    y: {
      tick: { format: d3format('d'), count: 6 }
    }
  },

  // Request chart data
  didReceiveAttrs() {
    this.get('requestData').perform();
  }
});