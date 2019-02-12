import Route from '@ember/routing/route';

export default Route.extend({

  model() {
    const owner = this.modelFor('organization');
    return owner.githubAppsRepositoriesOnOrg.load();
  }

});

