import ModalFunctionality from 'nilavu/mixins/modal-functionality';
import NilavuURL from 'nilavu/lib/url';
import {  extractError } from 'nilavu/lib/ajax-error';

// Modal for editing / creating a category
export default Ember.Controller.extend(ModalFunctionality, {
    selectedTab: null,
    saving: false,
    deleting: false,
    panels: null,
    editLaunching: false,


    _initPanels: function() {
        this.set('panels', []);
        this.editLaunching = false;
    }.on('init'),


    /*  _changeInitialState:function() {
      alert('tearing');
      this.editLaunching = false;
      alert(this.get('model.launchoption'));
      alert(this.get('launchOption'));
    }.on('willDestroyElement'),
*/

    onShow() {
        this.changeSize();
        this.titleChanged();
        //this._changeInitialState();
    },

    changeSize: function() {
        if (!Ember.isEmpty(this.get('model.description'))) {
            this.set('controllers.modal.modalClass', 'edit-category-modal full');
        } else {
            this.set('controllers.modal.modalClass', 'edit-category-modal small');
        }
    }.observes('model.description'),

    title: function() {
        if (this.get('model.id')) {
            return I18n.t("category.edit_long") + " : " + this.get('model.name');
        }
        return I18n.t("launcher.title");
    }.property('model.id', 'model.name'),

    launchOption: function() {
        const option = this.get('model.launchoption') || "";
        return option.trim().length > 0 ? option : I18n.t("launchoption.default");
    }.property('model.launchoption'),


    launchableChanged: function() {
        this.set('model.launchoption', this.get('launchOption'));
        this.set('selectedTab', 'general');
        if (!this.editLaunching) {
            $(".hideme").slideToggle(250);
            this.toggleProperty('editLaunching');
        }
    }.observes('launchOption'),

    cookingChanged: function() {
        const launchable = this.get('launchOption') || "";
        if (launchable.trim().length > 0) {
            this.set('selectedTab', 'selection');
            $('.firstStep').slideToggle('fast');
        }
    }.observes('cooking'),

    titleChanged: function() {
        this.set('controllers.modal.title', this.get('title'));
    }.observes('title'),

    disabled: function() {
        if (this.get('saving') || this.get('selecting')) return true;

        if (!this.get('model.metaData.unitoption')) return true;

      //  if (!this.get('model.metaData.versionoption')) return true;

        return false;
    }.property('saving', 'selecting', 'model.metaData.unitoption', 'model.metaData.versionoption'),

    categoryName: function() {
        const name = this.get('name') || "";
        return name.trim().length > 0 ? name : I18n.t("preview");
    }.property('name'),

    saveLabel: function() {
        if (this.get('saving')) return "saving";
        return this.get('model.id') ? "category.save" : "category.create";
    }.property('saving', 'model.id'),

    actions: {
        nextCategory() {
            this.set('loading', true);
            alert('looading');
            const model = this.get('model');
            return Nilavu.ajax("/launchables/pools/" + this.get('model.launchoption') + ".json").then(result => {
                model.metaData.setProperties({
                    cooking: result
                });

                this.set('cooking', true);
            });

        },

        saveCategory() {
            const self = this,
                model = this.get('model'),
                parentCategory = Nilavu.Category.list().findBy('id', parseInt(model.get('parent_category_id'), 10));

            this.set('saving', true);
            model.set('parentCategory', parentCategory);

            this.get('model').save().then(function(result) {
                self.set('saving', false);
                self.send('closeModal');
                model.setProperties({
                    slug: result.category.slug,
                    id: result.category.id
                });
                NilavuURL.redirectTo("/c/" + Nilavu.Category.slugFor(model));
            }).catch(function(error) {
                self.flash(extractError(error), 'error');
                self.set('saving', false);
            });
        }
    }

});
