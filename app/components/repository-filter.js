import Component from '@ember/component';
import { task, timeout } from 'ember-concurrency';
import config from 'travis/config/environment';
import { inject as service } from '@ember/service';
import { or, notEmpty, reads } from '@ember/object/computed';
import { isPresent } from '@ember/utils';
import { htmlSafe } from '@ember/string';
import fuzzyMatch from 'travis/utils/fuzzy-match';

export default Component.extend({
  tagName: '',
  store: service(),

  query: '',

  hasQuery: notEmpty('query'),
  isLoading: reads('search.isRunning'),
  isFiltering: or('isLoading', 'hasQuery'),

  search: task(function* (query = '') {
    if (query === this.query) return;

    this.set('query', query);

    yield timeout(config.intervals.repositoryFilteringDebounceRate);
    yield this.repositories.applyFilter(query);
  }).restartable(),

  computeName(name, query) {
    return isPresent(query) ? htmlSafe(fuzzyMatch(name, query)) : name;
  }

});
