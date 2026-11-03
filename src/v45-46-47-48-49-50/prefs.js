import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PomodoroPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.set_default_size(680, 720);

        const timerPage = new Adw.PreferencesPage({
            title: _('Timer'),
            icon_name: 'alarm-symbolic',
        });
        window.add(timerPage);

        const durationGroup = new Adw.PreferencesGroup({
            title: _('Session durations'),
            description: _('Shape a rhythm that works for you.'),
        });
        timerPage.add(durationGroup);
        this._addSpinRow(durationGroup, settings, 'focus-duration', _('Focus'), _('Minutes of uninterrupted work'), 1, 120);
        this._addSpinRow(durationGroup, settings, 'short-break-duration', _('Short break'), _('A quick pause between sessions'), 1, 60);
        this._addSpinRow(durationGroup, settings, 'long-break-duration', _('Long break'), _('A longer pause after a focus cycle'), 1, 90);
        this._addSpinRow(durationGroup, settings, 'sessions-before-long-break', _('Focus cycle'), _('Sessions before a long break'), 2, 12);

        const flowGroup = new Adw.PreferencesGroup({title: _('Automation')});
        timerPage.add(flowGroup);
        this._addSwitchRow(flowGroup, settings, 'auto-start-breaks', _('Start breaks automatically'), _('Begin the next break without waiting'));
        this._addSwitchRow(flowGroup, settings, 'auto-start-focus', _('Start focus automatically'), _('Begin the next session after a break'));
        this._addSwitchRow(flowGroup, settings, 'do-not-disturb', _('Do Not Disturb during focus'), _('Restore the previous notification setting when the timer stops'));

        const feedbackGroup = new Adw.PreferencesGroup({title: _('Feedback')});
        timerPage.add(feedbackGroup);
        this._addSwitchRow(feedbackGroup, settings, 'show-notifications', _('Notifications'), _('Show a message when the timer finishes'));
        this._addSwitchRow(feedbackGroup, settings, 'play-sound', _('Completion sound'), _('Play the system completion sound'));

        const aboutPage = new Adw.PreferencesPage({title: _('About'), icon_name: 'help-about-symbolic'});
        window.add(aboutPage);
        const supportGroup = new Adw.PreferencesGroup({
            title: _('Focus Timer'),
        });
        aboutPage.add(supportGroup);
        const donateRow = new Adw.ActionRow({
            title: _('Support development'),
            subtitle: _('If Focus Timer helps you, consider making a donation.'),
            activatable: true,
        });
        const donateButton = new Gtk.Button({label: _('Donate'), valign: Gtk.Align.CENTER, css_classes: ['suggested-action']});
        donateButton.connect('clicked', () => Gtk.show_uri(window, 'https://paypal.me/leandrosb3', Gdk.CURRENT_TIME));
        donateRow.add_suffix(donateButton);
        supportGroup.add(donateRow);

        const sourceRow = new Adw.ActionRow({title: _('Source code'), subtitle: 'github.com/lsantiagoba/pomodoro', activatable: true});
        sourceRow.add_suffix(new Gtk.Image({icon_name: 'external-link-symbolic'}));
        sourceRow.connect('activated', () => Gtk.show_uri(window, 'https://github.com/lsantiagoba/pomodoro', Gdk.CURRENT_TIME));
        supportGroup.add(sourceRow);
    }

    _addSpinRow(group, settings, key, title, subtitle, min, max) {
        const row = new Adw.SpinRow({title, subtitle, adjustment: new Gtk.Adjustment({lower: min, upper: max, step_increment: 1, page_increment: 5})});
        settings.bind(key, row, 'value', Gio.SettingsBindFlags.DEFAULT);
        group.add(row);
    }

    _addSwitchRow(group, settings, key, title, subtitle) {
        const row = new Adw.SwitchRow({title, subtitle});
        settings.bind(key, row, 'active', Gio.SettingsBindFlags.DEFAULT);
        group.add(row);
    }
}
