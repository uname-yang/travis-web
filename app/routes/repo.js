import TravisRoute from 'travis/routes/basic';
import Repo from 'travis/models/repo';
import ScrollResetMixin from 'travis/mixins/scroll-reset';
import Ember from 'ember';

import { statusImage } from 'travis/utils/urls';

const { service } = Ember.inject;

export default TravisRoute.extend(ScrollResetMixin, {
  store: service(),
  tabStates: service(),

  titleToken(model) {
    return model.get('slug');
  },

  renderTemplate() {
    return this.render('repo', {
      into: 'main'
    });
  },

  setupController(controller, model) {
    this.controllerFor('repos').activate(this.get('tabStates.sidebarTab'));
    if (model && !model.get) {
      model = this.get('store').find('repo', model.id);
    }
    return controller.set('repo', model);
  },

  serialize(repo) {
    var name, owner, ref, slug;
    // slugs are sometimes unknown ???
    slug = Ember.getWithDefault(repo, 'slug', 'unknown/unknown');
    ref = slug.split('/');
    owner = ref[0];
    name = ref[1];

    return {
      owner: owner,
      name: name
    };
  },

  model(params) {
    var slug;
    slug = params.owner + '/' + params.name;
    return Repo.fetchBySlug(this.get('store'), slug);
  },

  headData: Ember.inject.service(),

  afterModel(model) {
    const title = `${model.get('slug') || '??'} — ${model.get('currentBuild.state')}`;
    this.set('headData.title', title);

    const image = statusImage(model.get('slug'), model.get('defaultBranch.name'), 'png');
    this.set('headData.image', image);

    const description = `${model.get('slug')} is running on Travis CI. So should you! 😎`;
    this.set('headData.description', description);
  },

  resetController() {
    return this.controllerFor('repo').deactivate();
  },

  actions: {
    error(error) {
      if (error.slug) {
        // if error thrown has a slug (ie. it was probably repo not found)
        // set the slug on main.error controller to allow to properly
        // display the repo information
        this.controllerFor('main.error').set('slug', error.slug);
      }
      return true;
    }
  }
});
